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

// 1. Make Json file
// 2. show json map
// 3. start to make conditionals

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
