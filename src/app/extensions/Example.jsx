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
  MultiSelect,
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
  const [dropdownOptions, setDropdownOptions] = useState({});

  useEffect(() => {
    const loadDropdownOptions = async () => {
      const dropdownKeys = getDropdownKeys(fieldConfig);

      if (!dropdownKeys.length) return;

      const response = await runServerless({
        name: "myFunc",
        parameters: {
          properties: dropdownKeys,
        },
      });
      console.log("Dropdown Keys:", dropdownKeys);
      console.log("Response:", response);
      if (response.response?.optionsByProperty) {
        setDropdownOptions(response.response.optionsByProperty);
      }
    };

    loadDropdownOptions();
  }, []);

  // Call serverless function to execute with parameters.
  // The `myFunc` function name is configured inside `serverless.json`
  const handleClick = async () => {
    const { response } = await runServerless({
      name: "myFunc",
      parameters: { properties: formValues },
    });
    sendAlert({ message: response });
  };

  // Extract all dropdown property keys
  const getDropdownKeys = (config) => {
    return config
      .flatMap((section) => section.fields)
      .filter((field) => field.type === "dropdown")
      .map((field) => field.key);
  };

  const handleChange = (key, value) => {
    setFormValues((prev) => {
      const updated = { ...prev, [key]: value };
      console.log("Updated form values:", updated);
      return updated;
    });
  };

  const checkCondition = (condition, formValues) => {
    if (!condition) return true;

    const value = formValues[condition.key];

    if (value === undefined || value === null || value === "") {
      return condition.includeUnset || false;
    }

    if ("equals" in condition) return value === condition.equals;
    if ("notEquals" in condition) return value !== condition.notEquals || null;
    if ("greaterThan" in condition)
      return Number(value) > condition.greaterThan;
    if ("lessThan" in condition) return Number(value) < condition.lessThan;
    if ("in" in condition) return condition.in.includes(value);

    return true; // Default to show if unknown
  };

  const sanitizeFormValues = (values) => {
    return Object.fromEntries(
      Object.entries(values).map(([key, val]) => [key, normalizeValue(val)])
    );
  };

  const normalizeValue = (val) => {
    if (val === undefined || val === null) return null;
  
    // Handle dropdowns or selects with `{ label, value }`
    if (typeof val === "object" && "value" in val) {
      return val.value;
    }
  
    // Handle date objects like `{ year, month, day }`
    if (typeof val === "object" && isDateObject(val)) {
      return convertDateObject(val); // returns "YYYY-MM-DD"
    }
  
    // Handle checkboxes (booleans)
    if (typeof val === "boolean") {
      return val;
    }
  
    // Handle all other primitives (strings, numbers)
    return val;
  };
  
  const isDateObject = (val) =>
    typeof val.year === "number" &&
    typeof val.month === "number" &&
    (typeof val.day === "number" || typeof val.date === "number");
  
    const convertDateObject = (val) => {
      try {
        const day = val.day ?? val.date; // support both
        const date = new Date(val.year, val.month - 1, day);
        return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
      } catch {
        return null;
      }
    };

  const handleSave = async () => {
    // Transform values before sending to HubSpot
    const cleanValues = sanitizeFormValues(formValues);
  
    console.log("🧼 Cleaned values to save:", cleanValues);
  
    const response = await runServerless({
      name: "saveDealProperties",
      parameters: {
        dealId: context?.crm?.objectId,
        updates: cleanValues,
      },
    });

    console.log("This is the response:", response)
  
    if (response?.error) {
      sendAlert({ message: "❌ Failed to save data", type: "error" });
    } else {
      sendAlert({ message: "✅ Saved successfully", type: "success" });
    }
  };

  return (
    <>
      {fieldConfig.map((section, i) => {
        const shouldShow = checkCondition(section.condition, formValues);
        if (!shouldShow) return null;

        return (
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
                    options={dropdownOptions[field.key] || []}
                    value={formValues[field.key]}
                    placeholder={`Choose ${field.label}`}
                    onChange={(val) => handleChange(field.key, val)}
                  />
                ) : field.type === "number" ? (
                  <NumberInput
                    label={field.label}
                    readOnly={true}
                    placeholder={`Enter ${field.label}`}
                    onChange={(val) => handleChange(field.key, val)}
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
        );
      })}
      <Text>
        <Text>This is Dev</Text>
      </Text>
      <Button onClick={() => console.log("THis is the context", context.crm.objectId)}>Print Context</Button>
      <Button onClick={handleSave}>
        Save
      </Button>
    </>
  );
};
