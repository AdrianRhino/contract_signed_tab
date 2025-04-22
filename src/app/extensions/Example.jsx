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
  NumberInput,
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
  
  const [formValues, setFormValues] = useState({});
  const [dateValue, setDateValue] = useState();

  const handleChange = (key, value) => {
    setFormValues((prev) => {
      const updated = { ...prev, [key]: value };
      console.log("Updated form values:", updated);
      return updated;
    });
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
                  placeholder={`Enter ${field.label}`}
                  onInput={(val) => handleChange(field.key, val)}
                />
              ) : field.type === "dropdown" ? (
                <Select
                  label={field.label}
                  name={field.key}
                  options={field.options}
                  value={formValues[field.key]}
                  placeholder={`Enter ${field.label}`}
                  onChange={(val) => handleChange(field.key, val)}
                />
              ) : field.type === "number" ? (
                <NumberInput
                  label={field.label}
                  placeholder={`Enter ${field.label}`}
                />
              ) : field.type === "checkbox" ? (
                <Checkbox
                  name="adminCheck"
                  onChange={(val) => handleChange(field.key, val)}
                >
                  {field.label}
                </Checkbox>
              ) : field.type === "date" ? (
                <DateInput
                  label={field.label}
                  name="date"
                  onChange={(val) => handleChange(field.key, val)}
                  value={dateValue}
                  format="long"
                />
              ) : field.type === "Single-line text" ? (
                <Input
                  label={field.label}
                  placeholder={`Enter ${field.label}`}
                  onChange={(val) => handleChange(field.key, val)}
                />
              ) : field.type === "file" ? (
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
      <Button onClick={() => console.log("Saved...")}>Save</Button>
    </>
  );
};
