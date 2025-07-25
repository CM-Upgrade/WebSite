# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the UpgradeMate website project repository. Currently in early development stage with documentation and mockup assets only. The project will be built as a Next.js 14+ application with the App Router pattern.

## Technology Stack (Planned)

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand or React Context

## Repository Structure

```
/
├── README.md              # Project overview and structure
├── docs/                  # Documentation and content
│   ├── upgrademate_pricing.md    # Pricing model and calculations
│   └── upgrademate_webcontent.md # (Empty - placeholder for web content)
├── images/                # Branding assets and mockups
│   ├── Logo*.png         # Brand logos in various formats
│   ├── UpgradeMate.ico   # Favicon
│   └── WebSiteMockup*.png # Design mockups
└── mockup_html/           # HTML prototypes
    └── homepage.html      # (Empty - placeholder for homepage mockup)
```

## Development Status

This repository is in the **planning/documentation phase**. No actual Next.js application code exists yet. The current contents include:

- Business documentation (pricing model)
- Brand assets and logos
- Placeholder files for web content and HTML mockups

## Key Content References

- **Pricing Information**: `docs/upgrademate_pricing.md:1` contains the complete pricing model for UpgradeMate software
- **Brand Assets**: All logos and branding materials are in `/images/` directory
- **Design References**: Website mockups available as `images/WebSiteMockup01.png` and `images/WebSiteMockup02.png`

## Development Commands (When Initialized)

Once the Next.js project is initialized, common commands will be:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Context

**UpgradeMate** is a software solution for managing computer upgrades. The website should communicate:
- Clear pricing structure (see `docs/upgrademate_pricing.md`)
- Professional brand identity (logos in `/images/`)
- Simple, transparent pricing model starting at $1,000/year for up to 2,000 computers

## When Starting Development

1. Initialize with: `npx create-next-app@latest . --typescript --tailwind --app --eslint`
2. Use the brand colors from the logo assets
3. Reference the mockup designs in `images/WebSiteMockup01.png` and `images/WebSiteMockup02.png`
4. Implement the pricing calculator based on the tiered structure in `docs/upgrademate_pricing.md`

## Standard Workflow

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.