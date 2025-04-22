# HubSpot Getting Started Project Template

This is the Getting Started project for HubSpot developer projects. It contains a private app, a CRM card written in React, and a serverless function that the CRM card is able to interact with. This code is intended to help developers get up and running with developer projects quickly and easily.

## Requirements

There are a few things that must be set up before you can make use of this getting started project.

- You must have an active HubSpot account.
- You must have the [HubSpot CLI](https://www.npmjs.com/package/@hubspot/cli) installed and set up.
- You must have access to developer projects (developer projects are currently [in public beta under "CRM Development Tools"](https://app.hubspot.com/l/whats-new/betas)).

## Usage

The HubSpot CLI enables you to run this project locally so that you may test and iterate quickly. Getting started is simple, just run this HubSpot CLI command in your project directory and follow the prompts:

`hs project dev`


// 1. Define your field structure
//    → Make a JSON file with sections + fields

// 2. Load and show the JSON
//    → Map each section and field to the screen (text-only first)

// 3. Ask ChatGPT to follow the format
//    → Use it to help clean, expand, or convert into shapes

// 4. Generate the correct input components
//    → Match each property type to the right UI element

// 5. Add property options (e.g., dropdowns, radios)
//    → Use the JSON config to render dynamic choices

// 6. Store all input values in state
//    → Use useState or a single state object keyed by field

// 7. Add conditionals or visibility rules (optional)
//    → Show/hide fields based on earlier answers

// 8. Save all values
//    → On submit, send state to a serverless save function

// 9. Load initial values
//    → On mount, fetch deal data and populate the form

// 10. Pull everything dynamically from HubSpot
//     → Use serverless functions to get property values or deal details

// 11. Add validation for required fields

// 12. Auto-save as user types (instead of submit)

// 13. Add JSON-driven visibility rules (like if X is true, show Y)

// 14. Connect to workflows or alerts (e.g. send reminder if incomplete)

// 15. Sync different users' changes to the same deal