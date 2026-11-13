import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission, logActivity } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const schedule = await prisma.installationSchedule.findUnique({
    where: { projectId: id },
    include: { project: { select: { id: true, name: true, projectCode: true } } },
  });

  return NextResponse.json({ schedule });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session, "projects:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: projectId } = await context.params;
    const body = await req.json();

    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { installationSchedule: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const prevSchedule = existingProject.installationSchedule;
    const isRescheduled =
      prevSchedule?.installationDate &&
      body.installationDate &&
      new Date(body.installationDate).getTime() !== new Date(prevSchedule.installationDate).getTime();

    const newStatus = body.status || (isRescheduled ? "Rescheduled" : body.installationDate ? "Scheduled" : prevSchedule?.status || "Not Scheduled");

    const schedule = await prisma.installationSchedule.upsert({
      where: { projectId },
      create: {
        projectId,
        installationDate: body.installationDate ? new Date(body.installationDate) : null,
        expectedCompletionDate: body.expectedCompletionDate ? new Date(body.expectedCompletionDate) : null,
        installationTime: body.installationTime || null,
        supervisor: body.supervisor || null,
        teamMembers: body.teamMembers || null,
        siteContactPerson: body.siteContactPerson || null,
        siteContactNumber: body.siteContactNumber || null,
        installationAddress: body.installationAddress || null,
        internalRemarks: body.internalRemarks || null,
        customerInstructions: body.customerInstructions || null,
        status: newStatus,
        rescheduledCount: isRescheduled ? (prevSchedule?.rescheduledCount || 0) + 1 : prevSchedule?.rescheduledCount || 0,
      },
      update: {
        installationDate: body.installationDate ? new Date(body.installationDate) : null,
        expectedCompletionDate: body.expectedCompletionDate ? new Date(body.expectedCompletionDate) : null,
        installationTime: body.installationTime || null,
        supervisor: body.supervisor || null,
        teamMembers: body.teamMembers || null,
        siteContactPerson: body.siteContactPerson || null,
        siteContactNumber: body.siteContactNumber || null,
        installationAddress: body.installationAddress || null,
        internalRemarks: body.internalRemarks || null,
        customerInstructions: body.customerInstructions || null,
        status: newStatus,
        rescheduledCount: isRescheduled ? (prevSchedule?.rescheduledCount || 0) + 1 : undefined,
      },
    });

    // Map schedule status to Project status workflow:
    // 1. Project Created -> 2. Installation Not Scheduled -> 3. Installation Scheduled -> 4. Installation In Progress -> 5. Partially Installed -> 6. Installation Completed
    let projectStatus = existingProject.status;
    if (newStatus === "Scheduled" || newStatus === "Rescheduled") {
      projectStatus = "Installation Scheduled";
    } else if (newStatus === "Installation In Progress") {
      projectStatus = "Installation In Progress";
    } else if (newStatus === "Partially Installed") {
      projectStatus = "Partially Installed";
    } else if (newStatus === "Completed") {
      projectStatus = "Installation Completed";
    } else if (newStatus === "Not Scheduled") {
      projectStatus = "Installation Not Scheduled";
    }

    if (body.projectStatus) projectStatus = body.projectStatus;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: projectStatus,
        startDate: body.installationDate ? new Date(body.installationDate) : undefined,
        expectedCompletionDate: body.expectedCompletionDate ? new Date(body.expectedCompletionDate) : undefined,
      },
    });

    await logActivity({
      userId: session.id,
      action: isRescheduled ? "RESCHEDULE_INSTALLATION" : "SCHEDULE_INSTALLATION",
      entityType: "PROJECT",
      entityId: projectId,
      summary: `Updated installation for project ${existingProject.projectCode}: ${newStatus}${
        body.installationDate ? ` on ${new Date(body.installationDate).toLocaleDateString("en-IN")}` : ""
      }${body.supervisor ? ` (Supervisor: ${body.supervisor})` : ""}`,
    });

    return NextResponse.json({ schedule, projectStatus });
  } catch (error) {
    console.error("Update installation schedule error:", error);
    return NextResponse.json({ error: "Failed to update installation schedule" }, { status: 500 });
  }
}

