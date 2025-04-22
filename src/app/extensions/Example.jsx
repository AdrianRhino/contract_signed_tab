import React, { useState } from "react";
import {
  Divider,
  Link,
  Button,
  Text,
  Input,
  Flex,
  hubspot,
  Heading,
} from "@hubspot/ui-extensions";

import fields from "./config/fields.json";

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



// Define the extension to be run within the Hubspot CRM
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

// Define the Extension component, taking in runServerless, context, & sendAlert as props
const Extension = ({ context, runServerless, sendAlert }) => {
  const [text, setText] = useState("");

  // Call serverless function to execute with parameters.
  // The `myFunc` function name is configured inside `serverless.json`
  const handleClick = async () => {
    const { response } = await runServerless({
      name: "myFunc",
      parameters: { text: text },
    });
    sendAlert({ message: response });
  };

  return (
    <>
      {fields.map((section) => (
        <>
          <Text format={{ fontWeight: "bold", fontSize: "lg" }}>
            {section.section}
          </Text>

          {section.fields.map((field) => (
            <>
              <Text>{field.label}</Text>
              {/* Render your input here (Input, Dropdown, etc.) */}
            </>
          ))}
        </>
      ))}
      <Text>
        <Text>This is Dev</Text>
      </Text>
    </>
  );
};
