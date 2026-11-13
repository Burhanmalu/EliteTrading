import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { calculateSqFt, calculateQuotationTotals } from "../src/lib/format";
import { getDefaultDrawingConfig } from "../src/lib/drawing-types";

async function main() {
  console.log("Seeding EliteTrading ERP database...");

  // 1. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Full system administrator with catalogue, pricing override, and settings access",
      permissions: JSON.stringify(["*"]),
    },
  });

  const salesRole = await prisma.role.upsert({
    where: { name: "SALES_MANAGER" },
    update: {},
    create: {
      name: "SALES_MANAGER",
      description: "Manage customers, projects, quotations, and generate PDFs",
      permissions: JSON.stringify([
        "customers:read",
        "customers:write",
        "projects:read",
        "projects:write",
        "quotations:read",
        "quotations:write",
        "reports:read",
      ]),
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "VIEWER" },
    update: {},
    create: {
      name: "VIEWER",
      description: "Read-only access to dashboards, quotations, and reports",
      permissions: JSON.stringify([
        "customers:read",
        "projects:read",
        "quotations:read",
        "reports:read",
      ]),
    },
  });

  // 2. Users
  const adminHash = await bcrypt.hash("Admin@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@elitetradingfd.com" },
    update: {
      name: "Ali Asger",
    },
    create: {
      name: "Ali Asger",
      email: "admin@elitetradingfd.com",
      passwordHash: adminHash,
      phone: "+91 98110 44556",
      roleId: adminRole.id,
    },
  });

  // 3. Company Settings
  const companyDetails = {
    companyName: "EliteTrading",
    tagline: "Architectural Doors, Windows & Glass Systems | Contact: Ali Asger",
    website: "https://elitetradingfd.com",
    email: "elitetrading.contactus@gmail.com",
    phone: "+91 9755036143",
    address:
      "Shop 8, Jasmine Park, opposite RDB Building, Bijalpur, Indore, Madhya Pradesh 452012, India",
    gstNumber: "23AABCE4521K1Z8",
    panNumber: "AABCE4521K",
    logoUrl: "/logo.png",
    defaultGstPercent: 18,
    quotationPrefix: "ET",
    quotationNumberFormat: "{PREFIX}-{YEAR}-{SEQ}",
    bankName: "HDFC Bank",
    bankAccountNumber: "50200048291034",
    bankIfsc: "HDFC0000482",
  };
  await prisma.companySetting.upsert({
    where: { id: "default" },
    update: companyDetails,
    create: {
      id: "default",
      ...companyDetails,
    },
  });

  // 4. Default Terms & Conditions
  const existingTerms = await prisma.quotationTerm.count();
  if (existingTerms === 0) {
    await prisma.quotationTerm.createMany({
      data: [
        {
          title: "General Terms and Conditions",
          content: "1. GST and other Levies is excluding in above rates it will charge as applicable. Any further changes thereof shall be borne by client.\n2. Any Demarcations, scratches and damages on windows & doors during masonry or any other works shall be replaced only on request and the costs incurred to be borne by the client.\n3. Warranties:\n  i. White Profile Make of PROMINANCE Brand comes with a 20 years warranty.\n  ii. Color Laminate Profile Make of PROMINANCE Brand comes with a 20 years warranty.\n  iii. 5 Years Hardware Performance Warranty for any kind of Manufacturing Defect Reported.\n  iv. 1 Year After Sales Warranty whereas No labour charges for any kind of repairing.\n  Note: There is no warranty for any kind of breakage happened accidentally in window, and repairing for the same will be charge extra as per actual.\n4. There is no warranty offered on any glass breakage, Mosquito Mesh and on regular wear and tear.\n5. The quotation is valid for 15 days from the date of offer.\n6. Window size will be 2-3mm smaller than the actual size on all 4 sides for proper installation, tolerance level upto (+) 0mm & (-) 5mm.\n7. Clear Openings of walls should be in line level and in plumb.\n8. Quoted price will be recalculated if there is more than 50MM variation in height or width at final measurement.\n9. Complete fabricated windows and doors dispatched with adequate packing from our works.\n10. Safe and lockable storage area is to be provided by client on site.\n11. Installation will only begin once site is cleared by our personnel.\n12. Protection tape should be removed immediately while installation (maximum 15 days).\n13. Scope restricted to supply of windows and installation only; civil, carpentry or MS work excluded.\n14. Not responsible for delay caused by nature / other agency / strikes / lockdown / force majeure.\n15. Electricity and scaffolding provided by client on site wherever required.\n16. Customer requested to check installed windows/doors and sign completion certificate within 2 days.\n17. Changes in details/drawings to be communicated before production schedule.\n18. Transportation of Goods charged extra as per actual.\n19. Payment terms: 50% advance with confirmed order, 45% before dispatch against workshop inspection, remaining after completion.\n20. Errors and Omissions expected (E & O E).",
          sortOrder: 1,
        },
      ],
    });
  }

  // 5. Product Categories
  const categoriesData = [
    { name: "Infinity Metal French Doors & Windows", slug: "infinity-metal", showUpvcFields: false, sortOrder: 1 },
    { name: "UPVC Windows and Doors", slug: "upvc-windows", showUpvcFields: true, sortOrder: 2 },
    { name: "Aluminium Systems", slug: "aluminium-systems", showUpvcFields: false, sortOrder: 3 },
    { name: "Domal Systems", slug: "domal-systems", showUpvcFields: false, sortOrder: 4 },
    { name: "Glass Partitions", slug: "glass-partitions", showUpvcFields: false, sortOrder: 5 },
  ];

  const categoryMap: Record<string, { id: string; name: string; showUpvcFields: boolean }> = {};
  for (const cat of categoriesData) {
    const c = await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, showUpvcFields: cat.showUpvcFields, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap[cat.slug] = c;
  }

  // 6. Brands
  const brandsData = [
    { name: "Saint Gobain", slug: "saint-gobain", description: "Saint Gobain Inventa uPVC Systems" },
    { name: "Prominance", slug: "prominance", description: "Prominance uPVC Window & Door Profiles" },
    { name: "Yaduwanshi", slug: "yaduwanshi", description: "Yaduwanshi uPVC Architectural Profiles" },
    { name: "Elite Infinity", slug: "elite-infinity", description: "Infinity Metal French Doors & Windows" },
    { name: "Elite AluTech", slug: "elite-alutech", description: "Architectural Aluminium & Domal Systems" },
  ];

  const brandMap: Record<string, { id: string; name: string }> = {};
  for (const b of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name },
      create: b,
    });
    brandMap[b.slug] = brand;
  }

  // 7. Products
  const productsSeed = [
    // Category A: Infinity Metal French Doors & Windows
    {
      code: "IM-FD-01",
      name: "Infinity Metal French Door",
      catSlug: "infinity-metal",
      brandSlug: "elite-infinity",
      drawingType: "FRENCH_DOOR",
      defaultWidthMm: 1800,
      defaultHeightMm: 2400,
      defaultRatePerSqFt: 1150,
      spec: {
        profileSystem: "Infinity Slim Steel / Metal 45mm",
        glassType: "12mm Toughened Clear Glass",
        profileColour: "Matte Charcoal Black",
        locking: "3-Point Mortise Lever Lock",
        handleColour: "Brushed Brass / Matte Black",
        handleType: "Designer Pull Handle",
        rollerType: "Heavy Duty Concealed Hinges",
      },
    },
    {
      code: "IM-MW-02",
      name: "Infinity Metal Window",
      catSlug: "infinity-metal",
      brandSlug: "elite-infinity",
      drawingType: "METAL_WINDOW",
      defaultWidthMm: 1500,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 980,
      spec: {
        profileSystem: "Infinity Slim Metal 40mm",
        glassType: "10mm Toughened Clear Glass",
        profileColour: "Matte Black Powder Coated",
        locking: "Multi-Point Espag",
        handleColour: "Matte Black",
        handleType: "Heritage Lever Handle",
        rollerType: "Friction Stay Hinges",
      },
    },
    {
      code: "IM-CMD-03",
      name: "Custom Metal Door",
      catSlug: "infinity-metal",
      brandSlug: "elite-infinity",
      drawingType: "FRENCH_DOOR",
      defaultWidthMm: 2100,
      defaultHeightMm: 2400,
      defaultRatePerSqFt: 1250,
      spec: {
        profileSystem: "Infinity Custom Metal Series",
        glassType: "6+12+6 DGU Toughened",
        profileColour: "Antique Bronze",
        locking: "Heavy Duty Mortise Lock",
        handleColour: "Antique Bronze",
        handleType: "Custom Architectural Bar",
        rollerType: "3D Adjustable Hinges",
      },
    },
    {
      code: "IM-CMW-04",
      name: "Custom Metal Window",
      catSlug: "infinity-metal",
      brandSlug: "elite-infinity",
      drawingType: "METAL_WINDOW",
      defaultWidthMm: 1800,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 1020,
      spec: {
        profileSystem: "Infinity Custom Metal Series",
        glassType: "8mm Toughened Tinted",
        profileColour: "Charcoal Grey",
        locking: "Single Point Latch",
        handleColour: "Charcoal Grey",
        handleType: "Slim Casement Handle",
        rollerType: "SS 304 Friction Stay",
      },
    },

    // Category B: UPVC Windows and Doors
    {
      code: "UPVC-SG-01",
      name: "Inventa SD 3 Track Door",
      catSlug: "upvc-windows",
      brandSlug: "saint-gobain",
      drawingType: "SLIDING_3_TRACK_DOOR",
      defaultWidthMm: 2463,
      defaultHeightMm: 2150,
      defaultRatePerSqFt: 585,
      spec: {
        profileSystem: "Saint Gobain Inventa 3 Track",
        glassType: "6mm Clear Toughened",
        profileColour: "Ivory White",
        meshType: "SS 304 Pleated / 304 Mesh",
        track: "Inventa 3 Track Frame",
        trackRi: "1.5mm GI Reinforcement",
        slidingSash: "Inventa Door Sash 72mm",
        slidingSashRi: "2.0mm GI Reinforcement",
        flymeshSash: "Inventa Flymesh Sash",
        mullionRi: "1.5mm GI Box",
        locking: "Touch Lock / Multi-Point",
        handleColour: "White",
        handleType: "D-Handle with Key",
        lockableEspag: "Yes – 1000mm Espag",
        rollerType: "Heavy Duty Double Tandem",
      },
    },
    {
      code: "UPVC-SG-02",
      name: "Ventilation",
      catSlug: "upvc-windows",
      brandSlug: "saint-gobain",
      drawingType: "VENTILATION",
      defaultWidthMm: 800,
      defaultHeightMm: 2150,
      defaultRatePerSqFt: 480,
      panelsJson: JSON.stringify({
        viewSide: "INSIDE",
        frameStyle: "UPVC",
        hasSectionDimensions: true,
        linkWidths: true,
        topHeightMm: 450,
        bottomHeightMm: 1700,
        fanWidthMm: 400,
        glassWidthMm: 400,
        panels: [
          { id: "p-1", label: "FAN", kind: "VENTILATION", widthRatio: 0.5, widthMm: 400, slideDirection: "NONE" },
          { id: "p-2", label: "F", kind: "FIXED", widthRatio: 0.5, widthMm: 400, slideDirection: "NONE" },
        ],
      }),
      spec: {
        profileSystem: "Saint Gobain Inventa Casement",
        glassType: "5mm Frosted / Louvered Glass",
        profileColour: "White",
        meshType: "Fixed SS Mesh",
        track: "Casement Outer Frame",
        trackRi: "1.2mm GI",
        slidingSash: "N/A",
        slidingSashRi: "N/A",
        flymeshSash: "Fixed Mesh Frame",
        mullionRi: "1.2mm GI",
        locking: "Exhaust Latch",
        handleColour: "White",
        handleType: "Compact Latch",
        lockableEspag: "No",
        rollerType: "Louver Clips",
      },
    },
    {
      code: "UPVC-SG-05",
      name: "Ventilation (Exhaust Fan + Fixed)",
      catSlug: "upvc-windows",
      brandSlug: "saint-gobain",
      drawingType: "VENTILATION_FAN",
      defaultWidthMm: 792,
      defaultHeightMm: 1478,
      defaultRatePerSqFt: 510,
      spec: {
        profileSystem: "Saint Gobain Inventa Casement",
        glassType: "(1,3) 5mm Frosted Toughened + (2) Exhaust Fan Provision",
        profileColour: "White",
        meshType: "N/A",
        track: "Casement Outer Frame 60mm",
        trackRi: "1.5mm GI",
        slidingSash: "N/A",
        slidingSashRi: "N/A",
        flymeshSash: "N/A",
        mullionRi: "M1 / T1 Transom 1.5mm GI",
        locking: "Fixed Frame",
        handleColour: "N/A",
        handleType: "N/A",
        lockableEspag: "No",
        rollerType: "Exhaust Fan Mounting",
      },
    },
    {
      code: "UPVC-SG-03",
      name: "3 Track – 2 Glass 1 Mesh Panel",
      catSlug: "upvc-windows",
      brandSlug: "saint-gobain",
      drawingType: "SLIDING_3_TRACK_2G1M",
      defaultWidthMm: 2100,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 545,
      spec: {
        profileSystem: "Saint Gobain Inventa 3 Track",
        glassType: "5mm Clear Toughened",
        profileColour: "White",
        meshType: "SS 304 Mosquito Mesh",
        track: "Inventa 3 Track 99mm",
        trackRi: "1.5mm GI",
        slidingSash: "Inventa Window Sash",
        slidingSashRi: "1.5mm GI",
        flymeshSash: "Inventa Flymesh Sash",
        mullionRi: "N/A",
        locking: "Crescent / Touch Lock",
        handleColour: "White",
        handleType: "Pop-up Handle",
        lockableEspag: "Yes",
        rollerType: "Single Nylon Heavy Roller",
      },
    },
    {
      code: "UPVC-PR-04",
      name: "SD 3 TRACK",
      catSlug: "upvc-windows",
      brandSlug: "prominance",
      drawingType: "SD_3_TRACK",
      defaultWidthMm: 2400,
      defaultHeightMm: 2100,
      defaultRatePerSqFt: 560,
      spec: {
        profileSystem: "Prominance 3 Track Door Series",
        glassType: "6mm Toughened Clear",
        profileColour: "Walnut Laminate",
        meshType: "SS 304 Mesh",
        track: "Prominance 112mm 3 Track",
        trackRi: "1.5mm GI",
        slidingSash: "Prominance Heavy Door Sash",
        slidingSashRi: "2.0mm GI",
        flymeshSash: "Prominance Mesh Sash",
        mullionRi: "1.5mm GI",
        locking: "Multi-Point Key Lock",
        handleColour: "Brown / Bronze",
        handleType: "Lever Door Handle",
        lockableEspag: "Yes",
        rollerType: "Double Bearing Tandem",
      },
    },
    {
      code: "UPVC-SG-05",
      name: "Inventa 3 Track Window",
      catSlug: "upvc-windows",
      brandSlug: "saint-gobain",
      drawingType: "SLIDING_3_TRACK_WINDOW",
      defaultWidthMm: 1800,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 530,
      spec: {
        profileSystem: "Saint Gobain Inventa 3 Track",
        glassType: "5mm Clear Float",
        profileColour: "White",
        meshType: "SS 304 Mesh",
        track: "Inventa 3 Track Frame",
        trackRi: "1.2mm GI",
        slidingSash: "Inventa Window Sash",
        slidingSashRi: "1.5mm GI",
        flymeshSash: "Inventa Flymesh Sash",
        mullionRi: "N/A",
        locking: "Touch Lock",
        handleColour: "White",
        handleType: "Standard Sliding Handle",
        lockableEspag: "Yes",
        rollerType: "Adjustable SS Roller",
      },
    },
    {
      code: "UPVC-YD-06",
      name: "L TYPE FIXED 3 TRACK",
      catSlug: "upvc-windows",
      brandSlug: "yaduwanshi",
      drawingType: "L_TYPE_FIXED_3_TRACK",
      defaultWidthMm: 2700,
      defaultHeightMm: 1800,
      defaultRatePerSqFt: 590,
      spec: {
        profileSystem: "Yaduwanshi Corner 3 Track",
        glassType: "6mm Toughened Clear",
        profileColour: "White",
        meshType: "SS 304 Mesh",
        track: "3 Track + Corner Coupler",
        trackRi: "1.5mm GI",
        slidingSash: "Yaduwanshi 62mm Sash",
        slidingSashRi: "1.5mm GI",
        flymeshSash: "Yaduwanshi Mesh Sash",
        mullionRi: "2.0mm Heavy Corner Box",
        locking: "Multi-Point Espag",
        handleColour: "White",
        handleType: "C-Type Handle",
        lockableEspag: "Yes",
        rollerType: "Heavy Tandem Roller",
      },
    },
    {
      code: "UPVC-PR-07",
      name: "Openable – Fixed",
      catSlug: "upvc-windows",
      brandSlug: "prominance",
      drawingType: "OPENABLE_FIXED",
      defaultWidthMm: 1500,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 520,
      spec: {
        profileSystem: "Prominance 60mm Casement",
        glassType: "5mm Clear Toughened",
        profileColour: "White",
        meshType: "Optional Pleated",
        track: "60mm Casement Outer",
        trackRi: "1.5mm GI",
        slidingSash: "Casement Z-Sash",
        slidingSashRi: "1.5mm GI",
        flymeshSash: "N/A",
        mullionRi: "1.5mm T-Mullion GI",
        locking: "Multi-Point Espag",
        handleColour: "White",
        handleType: "Cockspur / Espag Handle",
        lockableEspag: "Yes",
        rollerType: "SS 304 Friction Hinges",
      },
    },
    {
      code: "UPVC-YD-08",
      name: "FIXED",
      catSlug: "upvc-windows",
      brandSlug: "yaduwanshi",
      drawingType: "FIXED_WINDOW",
      defaultWidthMm: 1200,
      defaultHeightMm: 1200,
      defaultRatePerSqFt: 410,
      spec: {
        profileSystem: "Yaduwanshi Fixed Frame 60mm",
        glassType: "6mm Clear Toughened",
        profileColour: "White",
        meshType: "None",
        track: "Fixed Outer Frame",
        trackRi: "1.2mm GI",
        slidingSash: "N/A",
        slidingSashRi: "N/A",
        flymeshSash: "N/A",
        mullionRi: "N/A",
        locking: "N/A",
        handleColour: "N/A",
        handleType: "N/A",
        lockableEspag: "No",
        rollerType: "EPDM Glazing Gasket",
      },
    },

    // Category C: Aluminium Systems
    {
      code: "ALU-SD-01",
      name: "Aluminium Sliding Door",
      catSlug: "aluminium-systems",
      brandSlug: "elite-alutech",
      drawingType: "SLIDING_2_TRACK",
      defaultWidthMm: 2400,
      defaultHeightMm: 2150,
      defaultRatePerSqFt: 680,
      spec: {
        profileSystem: "AluTech SlimLine 29mm",
        glassType: "8mm Toughened Clear",
        profileColour: "Anodized Matte Black",
        locking: "Flush Multi-Point Lock",
        handleColour: "Matte Black",
        handleType: "Recessed Architectural Pull",
        rollerType: "120kg SS Bearing Roller",
      },
    },
    {
      code: "ALU-SW-02",
      name: "Aluminium Sliding Window",
      catSlug: "aluminium-systems",
      brandSlug: "elite-alutech",
      drawingType: "SLIDING_3_TRACK_2G1M",
      defaultWidthMm: 1800,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 610,
      spec: {
        profileSystem: "AluTech 3-Track Thermal Break",
        glassType: "6mm Toughened Clear",
        profileColour: "Champagne Anodized",
        meshType: "SS 304 Mesh",
        locking: "Touch Lock",
        handleColour: "Champagne",
        handleType: "Slim C-Handle",
        rollerType: "Heavy Duty Tandem",
      },
    },
    {
      code: "ALU-OW-03",
      name: "Aluminium Openable Window",
      catSlug: "aluminium-systems",
      brandSlug: "elite-alutech",
      drawingType: "OPENABLE_CASEMENT",
      defaultWidthMm: 1200,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 640,
      spec: {
        profileSystem: "AluTech 45mm Casement",
        glassType: "6+12+6 DGU Glass",
        profileColour: "Dark Grey",
        locking: "Euro-Groove Multi-Point",
        handleColour: "Dark Grey",
        handleType: "Designer Lever Handle",
        rollerType: "3D Heavy Duty Hinges",
      },
    },
    {
      code: "ALU-FW-04",
      name: "Aluminium Fixed Window",
      catSlug: "aluminium-systems",
      brandSlug: "elite-alutech",
      drawingType: "FIXED_WINDOW",
      defaultWidthMm: 1500,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 490,
      spec: {
        profileSystem: "AluTech 45mm Fixed",
        glassType: "8mm Toughened Clear",
        profileColour: "Dark Grey",
      },
    },
    {
      code: "ALU-PT-05",
      name: "Aluminium Partition",
      catSlug: "aluminium-systems",
      brandSlug: "elite-alutech",
      drawingType: "ALUMINIUM_PARTITION",
      defaultWidthMm: 3000,
      defaultHeightMm: 2400,
      defaultRatePerSqFt: 560,
      spec: {
        profileSystem: "AluTech Slim Office Partition",
        glassType: "10mm Toughened Acoustic",
        profileColour: "Matte Black",
        locking: "Patch Mortise Lock",
        handleColour: "Matte Black",
        handleType: "600mm H-Handle",
      },
    },
    {
      code: "ALU-CS-06",
      name: "Custom Aluminium System",
      catSlug: "aluminium-systems",
      brandSlug: "elite-alutech",
      drawingType: "SLIDING_3_TRACK_DOOR",
      defaultWidthMm: 3000,
      defaultHeightMm: 2400,
      defaultRatePerSqFt: 740,
      spec: {
        profileSystem: "AluTech Custom Series",
        glassType: "6+12+6 DGU Toughened",
        profileColour: "Charcoal",
      },
    },

    // Category D: Domal Systems
    {
      code: "DOM-SW-01",
      name: "Domal Sliding Window",
      catSlug: "domal-systems",
      brandSlug: "elite-alutech",
      drawingType: "SLIDING_2_TRACK",
      defaultWidthMm: 1800,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 595,
      spec: {
        profileSystem: "Domal 27mm Heavy Series",
        glassType: "6mm Toughened Clear",
        profileColour: "Wooden Finish / Dark Grey",
        locking: "Domal Star Lock",
        handleColour: "Black",
        handleType: "Domal Concealed Handle",
        rollerType: "Domal Double Nylon Bearing",
      },
    },
    {
      code: "DOM-SD-02",
      name: "Domal Sliding Door",
      catSlug: "domal-systems",
      brandSlug: "elite-alutech",
      drawingType: "SLIDING_3_TRACK_DOOR",
      defaultWidthMm: 2400,
      defaultHeightMm: 2150,
      defaultRatePerSqFt: 650,
      spec: {
        profileSystem: "Domal 27mm 3-Track",
        glassType: "8mm Toughened Clear",
        profileColour: "Matte Black",
        meshType: "SS 304 Mesh",
        locking: "Domal Multi-Point",
        handleColour: "Black",
        handleType: "Domal Heavy Pull",
        rollerType: "Domal Heavy Tandem",
      },
    },
    {
      code: "DOM-OW-03",
      name: "Domal Openable Window",
      catSlug: "domal-systems",
      brandSlug: "elite-alutech",
      drawingType: "OPENABLE_CASEMENT",
      defaultWidthMm: 1200,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 620,
      spec: {
        profileSystem: "Domal 40mm Casement",
        glassType: "6mm Toughened",
        profileColour: "Ivory / Grey",
        locking: "Domal Espag",
      },
    },
    {
      code: "DOM-FW-04",
      name: "Domal Fixed Window",
      catSlug: "domal-systems",
      brandSlug: "elite-alutech",
      drawingType: "FIXED_WINDOW",
      defaultWidthMm: 1200,
      defaultHeightMm: 1500,
      defaultRatePerSqFt: 470,
      spec: {
        profileSystem: "Domal Fixed Frame",
        glassType: "6mm Toughened",
        profileColour: "Dark Grey",
      },
    },
    {
      code: "DOM-CS-05",
      name: "Custom Domal System",
      catSlug: "domal-systems",
      brandSlug: "elite-alutech",
      drawingType: "L_TYPE_FIXED_3_TRACK",
      defaultWidthMm: 2600,
      defaultHeightMm: 1800,
      defaultRatePerSqFt: 675,
      spec: {
        profileSystem: "Domal Custom Corner System",
        glassType: "8mm Toughened",
        profileColour: "Bronze Anodized",
      },
    },

    // Category E: Glass Partitions
    {
      code: "GP-FG-01",
      name: "Fixed Glass Partition",
      catSlug: "glass-partitions",
      brandSlug: "saint-gobain",
      drawingType: "FRAMELESS_GLASS",
      defaultWidthMm: 3000,
      defaultHeightMm: 2400,
      defaultRatePerSqFt: 490,
      spec: {
        profileSystem: "U-Channel Slim 25mm",
        glassType: "12mm Saint Gobain Clear Toughened",
        profileColour: "Brushed Silver / Matte Black",
      },
    },
    {
      code: "GP-FL-02",
      name: "Frameless Glass Partition",
      catSlug: "glass-partitions",
      brandSlug: "saint-gobain",
      drawingType: "FRAMELESS_GLASS",
      defaultWidthMm: 3200,
      defaultHeightMm: 2600,
      defaultRatePerSqFt: 540,
      spec: {
        profileSystem: "Frameless Patch Fitting",
        glassType: "12mm Extra Clear Toughened",
        locking: "Floor Spring + Patch Lock",
        handleType: "SS 304 600mm H-Handle",
      },
    },
    {
      code: "GP-AF-03",
      name: "Aluminium Frame Glass Partition",
      catSlug: "glass-partitions",
      brandSlug: "elite-alutech",
      drawingType: "ALUMINIUM_PARTITION",
      defaultWidthMm: 3000,
      defaultHeightMm: 2400,
      defaultRatePerSqFt: 580,
      spec: {
        profileSystem: "Slim Aluminium Acoustic Grid",
        glassType: "10mm Acoustic Laminated Glass",
        profileColour: "Matte Black",
        locking: "Acoustic Drop Seal + Lever Lock",
      },
    },
    {
      code: "GP-SG-04",
      name: "Sliding Glass Partition",
      catSlug: "glass-partitions",
      brandSlug: "saint-gobain",
      drawingType: "SLIDING_GLASS_PARTITION",
      defaultWidthMm: 2800,
      defaultHeightMm: 2400,
      defaultRatePerSqFt: 650,
      spec: {
        profileSystem: "Top-Hung Soft Close Track",
        glassType: "12mm Toughened Clear",
        profileColour: "Anodized Silver",
        rollerType: "Soft-Close Concealed Hanger",
      },
    },
    {
      code: "GP-CG-05",
      name: "Custom Glass Partition",
      catSlug: "glass-partitions",
      brandSlug: "saint-gobain",
      drawingType: "ALUMINIUM_PARTITION",
      defaultWidthMm: 3500,
      defaultHeightMm: 2700,
      defaultRatePerSqFt: 690,
      spec: {
        profileSystem: "Custom Fluted / Acoustic Partition",
        glassType: "12mm Fluted Toughened Glass",
        profileColour: "Champagne Gold",
      },
    },
  ];

  const productMap: Record<string, { id: string; code: string; name: string }> = {};
  for (const p of productsSeed) {
    const cat = categoryMap[p.catSlug];
    const brand = brandMap[p.brandSlug];
    const defaultCfg = getDefaultDrawingConfig(p.drawingType, p.defaultWidthMm);
    const prod = await prisma.product.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        drawingType: p.drawingType,
        defaultWidthMm: p.defaultWidthMm,
        defaultHeightMm: p.defaultHeightMm,
        defaultRatePerSqFt: p.defaultRatePerSqFt,
      },
      create: {
        code: p.code,
        name: p.name,
        categoryId: cat.id,
        brandId: brand.id,
        drawingType: p.drawingType,
        defaultPanelsJson: JSON.stringify(defaultCfg),
        defaultWidthMm: p.defaultWidthMm,
        defaultHeightMm: p.defaultHeightMm,
        defaultRatePerSqFt: p.defaultRatePerSqFt,
        specifications: {
          create: {
            profileSystem: p.spec.profileSystem ?? null,
            glassType: p.spec.glassType ?? null,
            profileColour: p.spec.profileColour ?? null,
            meshType: p.spec.meshType ?? null,
            track: p.spec.track ?? null,
            trackRi: p.spec.trackRi ?? null,
            slidingSash: p.spec.slidingSash ?? null,
            slidingSashRi: p.spec.slidingSashRi ?? null,
            flymeshSash: p.spec.flymeshSash ?? null,
            mullionRi: p.spec.mullionRi ?? null,
            locking: p.spec.locking ?? null,
            handleColour: p.spec.handleColour ?? null,
            handleType: p.spec.handleType ?? null,
            lockableEspag: p.spec.lockableEspag ?? null,
            rollerType: p.spec.rollerType ?? null,
          },
        },
      },
    });
    productMap[p.code] = prod;
  }

  // 8. Master Options
  const existingOptions = await prisma.masterOption.count();
  if (existingOptions === 0) {
    await prisma.masterOption.createMany({
      data: [
        { optionType: "PROFILE_SYSTEM", name: "Saint Gobain Inventa 3 Track", sortOrder: 1 },
        { optionType: "PROFILE_SYSTEM", name: "Prominance 3 Track Door Series", sortOrder: 2 },
        { optionType: "PROFILE_SYSTEM", name: "Yaduwanshi 62mm Series", sortOrder: 3 },
        { optionType: "PROFILE_SYSTEM", name: "Infinity Slim Metal 45mm", sortOrder: 4 },
        { optionType: "PROFILE_SYSTEM", name: "Domal 27mm Heavy Series", sortOrder: 5 },
        { optionType: "GLASS_TYPE", name: "5mm Clear Toughened", sortOrder: 1 },
        { optionType: "GLASS_TYPE", name: "6mm Clear Toughened", sortOrder: 2 },
        { optionType: "GLASS_TYPE", name: "8mm Clear Toughened", sortOrder: 3 },
        { optionType: "GLASS_TYPE", name: "12mm Clear Toughened", sortOrder: 4 },
        { optionType: "GLASS_TYPE", name: "6+12+6 DGU Acoustic", sortOrder: 5 },
        { optionType: "GLASS_TYPE", name: "5mm Frosted / Pinhead", sortOrder: 6 },
        { optionType: "PROFILE_COLOUR", name: "White", sortOrder: 1 },
        { optionType: "PROFILE_COLOUR", name: "Ivory White", sortOrder: 2 },
        { optionType: "PROFILE_COLOUR", name: "Walnut Laminate", sortOrder: 3 },
        { optionType: "PROFILE_COLOUR", name: "Matte Black", sortOrder: 4 },
        { optionType: "PROFILE_COLOUR", name: "Anthracite Grey", sortOrder: 5 },
        { optionType: "PROFILE_COLOUR", name: "Champagne Anodized", sortOrder: 6 },
        { optionType: "MESH_TYPE", name: "SS 304 Mosquito Mesh", sortOrder: 1 },
        { optionType: "MESH_TYPE", name: "Pleated Fiber Mesh", sortOrder: 2 },
        { optionType: "MESH_TYPE", name: "None", sortOrder: 3 },
        { optionType: "LOCKING", name: "Touch Lock", sortOrder: 1 },
        { optionType: "LOCKING", name: "Multi-Point Key Lock", sortOrder: 2 },
        { optionType: "LOCKING", name: "3-Point Mortise Lock", sortOrder: 3 },
        { optionType: "HANDLE_TYPE", name: "D-Handle with Key", sortOrder: 1 },
        { optionType: "HANDLE_TYPE", name: "Pop-up Handle", sortOrder: 2 },
        { optionType: "HANDLE_TYPE", name: "Designer Pull Handle", sortOrder: 3 },
        { optionType: "ROLLER_TYPE", name: "Heavy Duty Double Tandem", sortOrder: 1 },
        { optionType: "ROLLER_TYPE", name: "Adjustable SS 304 Roller", sortOrder: 2 },
        { optionType: "ROLLER_TYPE", name: "SS 304 Friction Hinges", sortOrder: 3 },
      ],
    });
  }

  console.log("Seeding completed successfully! (Clean system foundation seeded - zero mock customers/projects/quotations)");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
