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
  TextArea,
  Select,
  DateInput,
  Checkbox,
  NumberInput
} from "@hubspot/ui-extensions";

import fields from "./config/fields.json";

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
  const [formValues, setFormValues] = useState({});
  const [dateValue, setDateValue] = useState();

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
              {/* Render your input here (Input, Dropdown, etc.) */}
              {field.type === "Multi-line text" ? (
                <TextArea
                  label={field.label}
                  name={field.key}
                  value={formValues[field.key] || ""}
                  onInput={(val) => handleChange(field.key, val)}
                />
              ) : field.type === "dropdown" ? (
                <Select
                  label={field.label}
                  name={field.key}
                  options={field.options}
                  value={formValues[field.key]}
                  onChange={(val) => handleChange(field.key, val)}
                />
              ) : field.type === "number" ? (
                <NumberInput label={field.label} />
              ) : field.type === "checkbox" ? (
                <Checkbox
                  name="adminCheck"
                >
                  {field.label}
                </Checkbox>
              ) : field.type === "date" ? (
                <DateInput
                  label={field.label}
                  name="date"
                  onChange={(value) => {
                    setDateValue(value);
                  }}
                  value={dateValue}
                  format="ll"
                />
              ) : field.type === "Single-line text" ? (
                <Input label={field.label} />
              ) : field.type === "File" ? (
                <Text>{`${field.label} + file`}</Text>
              ) : (
                <Text>No Type Associated</Text>
              )}
              
            </>
          ))}
          <Divider />
        </>
      ))}
      <Text>
        <Text>This is Dev</Text>
      </Text>
      <Button onClick={() => console.log('Saved...')}>Save</Button>
    </>
  );
};
