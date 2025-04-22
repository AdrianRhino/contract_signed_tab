import React, { useState, useEffect } from "react";
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

// HubSpot extension entry point
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

// Main component
const Extension = ({ context, runServerless, sendAlert }) => {
  const [formValues, setFormValues] = useState({});
  const [dateValue, setDateValue] = useState();
  const [fieldConfig, setFieldConfig] = useState(fields); // ✅ Track enriched field config

  // Extract all dropdown property keys
  const getDropdownKeys = (sections) => {
    return sections
      .flatMap((section) => section.fields)
      .filter((field) => field.type === "dropdown")
      .map((field) => field.key);
  };

  // Fetch dropdown options on mount
  useEffect(() => {
    const loadDropdownOptions = async () => {
      const dropdownKeys = getDropdownKeys(fields);

      if (!dropdownKeys.length) return;

      try {
        const response = await runServerless({
          name: "getDealDropdownOptions",
          parameters: {
            properties: dropdownKeys,
          },
        });

        if (response?.optionsByProperty) {
          const enriched = fields.map((section) => ({
            ...section,
            fields: section.fields.map((field) => ({
              ...field,
              options:
                field.type === "dropdown"
                  ? response.optionsByProperty[field.key] || []
                  : field.options,
            })),
          }));

          setFieldConfig(enriched);
        }
      } catch (error) {
        console.error("❌ Failed to fetch dropdown options:", error);
        sendAlert({
          message: "Failed to load dropdown options from HubSpot.",
          type: "error",
        });
      }
    };

    loadDropdownOptions();
  }, []);

  const handleChange = (key, value) => {
    setFormValues((prev) => {
      const updated = { ...prev, [key]: value };
      console.log("Updated form values:", updated);
      return updated;
    });
  };

  return (
    <>
      {fieldConfig.map((section, i) => (
        <React.Fragment key={`section-${i}`}>
          <Text format={{ fontWeight: "bold", fontSize: "lg" }}>
            {section.section}
          </Text>

          {section.fields.map((field, j) => (
            <React.Fragment key={`field-${field.key}-${j}`}>
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
                  options={field.options || []}
                  value={formValues[field.key]}
                  placeholder={`Choose ${field.label}`}
                  onChange={(val) => handleChange(field.key, val)}
                />
              ) : field.type === "number" ? (
                <NumberInput
                  label={field.label}
                  placeholder={`Enter ${field.label}`}
                  onInput={(val) => handleChange(field.key, val)}
                />
              ) : field.type === "checkbox" ? (
                <Checkbox
                  name={field.key}
                  onChange={(val) => handleChange(field.key, val)}
                >
                  {field.label}
                </Checkbox>
              ) : field.type === "date" ? (
                <DateInput
                  label={field.label}
                  name={field.key}
                  onChange={(val) => handleChange(field.key, val)}
                  value={dateValue}
                  format="long"
                />
              ) : field.type === "Single-line text" ? (
                <Input
                  label={field.label}
                  placeholder={`Enter ${field.label}`}
                  value={formValues[field.key] || ""}
                  onInput={(val) => handleChange(field.key, val)}
                />
              ) : field.type === "file" ? (
                <Text>{`${field.label} (file upload placeholder)`}</Text>
              ) : (
                <Text>No Type Associated</Text>
              )}
            </React.Fragment>
          ))}
          <Divider />
        </React.Fragment>
      ))}

      <Text>
        <Text>This is Dev</Text>
      </Text>

      <Button onClick={() => console.log("Saved...", formValues)}>Save</Button>
    </>
  );
};
