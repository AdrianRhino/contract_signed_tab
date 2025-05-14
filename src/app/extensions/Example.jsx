import React, { useState, useEffect } from "react";
import {
  Divider,
  Link,
  Button,
  Text,
  Input,
  hubspot,
  TextArea,
  Select,
  DateInput,
  Checkbox,
  NumberInput,
  MultiSelect,
  Modal,
  ModalBody,
} from "@hubspot/ui-extensions";

import fields from "./config/fields.json";

// HubSpot extension entry point
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
    fetchCrmObjectProperties={actions.fetchCrmObjectProperties}
    refreshObjectProperties={actions.refreshObjectProperties}
    close={actions.closeOverlay}
  />
));

// Main component
const Extension = ({
  context,
  runServerless,
  sendAlert,
  refreshObjectProperties,
  close,
}) => {
  const [formValues, setFormValues] = useState({});
  const [fieldConfig, setFieldConfig] = useState(fields); // ✅ Track enriched field config
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [showMoreFinancingOptions, setShowMoreFinancingOptions] = useState(); // delete

  // Upon loading load the previous fields and drop down options
  useEffect(() => {
    loadPropertiesFromServerless();
    loadDropdownOptions();
  }, []);

  const normalizeCheckbox = (value) =>
    value === true || value === "true";
  
  useEffect(() => {
    setShowMoreFinancingOptions(normalizeCheckbox(formValues["more_financing_needed"]));
  }, [formValues["more_financing_needed"]]);

  // Load the dropdown options
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

  // Loads the properties from Hubspot
  const loadPropertiesFromServerless = async () => {
    const keys = fieldConfig
      .flatMap((section) =>
        section.fields.flatMap((field) => {
          const keys = [];
          if (field.key) keys.push(field.key); // main field key
          if (field.modal?.key) keys.push(field.modal.key); // nested modal key
          return keys;
        })
      )
      .filter(Boolean);

    const response = await runServerless({
      name: "getDealProperties",
      parameters: {
        dealId: context?.crm?.objectId,
        properties: keys,
      },
    });

    console.log("🔍 Full serverless response:", response.response.values);

    if (response?.response?.values) {
      console.log("✅ Loaded from serverless:", response.response.values);
      setFormValues(response.response.values);
    } else {
      console.warn(
        "❌ Failed to load via serverless:",
        response?.error || "Unknown"
      );
      sendAlert({ message: "Failed to load deal properties", type: "error" });
    }
  };

  // Extract all dropdown property keys
  const getDropdownKeys = (config) => {
    return config
      .flatMap((section) => section.fields)
      .filter((field) => field.type === "dropdown" || "multi-checkbox")
      .map((field) => field.key);
  };

  // Handle any property changes, maybe change to blur method (currently it prints on every keystroke and is annoying)
  const handleChange = (key, value) => {
    setFormValues((prev) => {
      const updated = { ...prev, [key]: value };
      console.log("Updated form values:", updated);
      return updated;
    });
  };

  // Prepares data to then send to hubspot
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

    // ✅ If it's a dropdown or multi-select array
    if (Array.isArray(val)) {
      return val.join(";"); // HubSpot's expected format
    }

    // Handle all other primitives (strings, numbers)
    return val;
  };

  const isDateObject = (val) =>
    typeof val.year === "number" &&
    typeof val.month === "number" &&
    (typeof val.day === "number" || typeof val.date === "number");

  // date converted to "YYYY-MM-DD" format from year, month, day
  const convertDateObject = (val) => {
    try {
      const day = val.day ?? val.date; // support both
      const date = new Date(val.year, val.month, day);

      console.log("To Hubspot Date: ", date.toISOString().split("T")[0]);
      return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
    } catch {
      return null;
    }
  };

  const convertToDateObject = (str) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;

    const [year, month, day] = str.split("-").map(Number);

    return {
      year,
      month: month - 1, // HubSpot expects 0-based months
      date: day, // Must be called `date` not `day`
    };
  };

  const getDateInputValue = (val) => {
    if (!val) return null;
    if (typeof val === "string") return convertToDateObject(val);
    if (typeof val === "object" && val.year && val.month >= 0 && val.date)
      return val;
    return null;
  };

  // Filters out read only fields to prevent the API call crashing
  const getWritableKeys = (config) => {
    return config.flatMap((section) =>
      section.fields.flatMap((field) => {
        if (field.type === "read-only" || field.type === "action-button") {
          // Skip writing for the button field
          // BUT if it has a modal key, we want that key to be writable
          return field.modal?.key ? [field.modal.key] : [];
        }
        // Normal writable field
        return field.key;
      })
    );
  };

  // Saves properties to hubspot
  const handleSave = async (overrides = {}) => {
    const writableKeys = getWritableKeys(fieldConfig);
    if (overrides) {
      console.log("These are the overrides: ", overrides);
    }

    const cleanValues = Object.fromEntries(
      Object.entries({
        ...formValues,
        ...overrides,
      })
        .filter(
          ([key]) =>
            writableKeys.includes(key) &&
            key !== "hs_object_id" &&
            // Always include keys from overrides
            (Object.keys(overrides).includes(key) ||
              key !== "third_round_financing_notes")
        )
        .map(([key, val]) => [key, normalizeValue(val)])
    );

    console.log("🧼Pre-Cleaned values to save:", cleanValues);

    const safeCleanValues = JSON.parse(JSON.stringify(cleanValues)); // removes undefineds, etc.

    console.log("🧼 Cleaned values to save:", safeCleanValues);

    const response = await runServerless({
      name: "saveDealProperties",
      parameters: {
        dealId: context?.crm?.objectId,
        updates: {
          ...safeCleanValues,
        },
      },
    });

    console.log("This is the response:", response);

    // Check for deeper-level errors
    const result = response?.result;

    if (result?.status === "error") {
      const errors = result?.errors || [];
      const firstError =
        errors[0]?.message || result?.message || "Unknown error";

      sendAlert({
        message: `❌ Failed to save: ${firstError}`,
        type: "error",
      });

      console.error("🔴 Save failed:", result);
      return;
    }

    refreshObjectProperties();
    sendAlert({ message: "✅ Saved successfully", type: "success" });
  };

  const renderField = (field) => {
    const value = formValues[field.key] || "";

    switch (field.type) {
      case "Multi-line text":
        return (
          <TextArea
            label={field.label}
            name={field.key}
            value={value}
            placeholder={`Enter ${field.label}`}
            onInput={(val) => handleChange(field.key, val)}
          />
        );

      case "dropdown":
        return (
          <Select
            label={field.label}
            name={field.key}
            options={dropdownOptions[field.key] || []}
            value={value}
            placeholder={`Choose ${field.label}`}
            onChange={(val) => handleChange(field.key, val)}
          />
        );

      case "number":
        return (
          <NumberInput
            label={field.label}
            placeholder={`Enter ${field.label}`}
            value={value}
            onChange={(val) => handleChange(field.key, val)}
          />
        );

      case "checkbox":
        return (
          <Checkbox
            name={field.key}
            onChange={(val) => handleChange(field.key, val)}
            checked={
              !!(
                value === true ||
                value === "true" ||
                value === "on" ||
                value === 1
              )
            }
          >
            {field.label}
          </Checkbox>
        );

      case "Single-line text":
        return (
          <Input
            label={field.label}
            placeholder={`Enter ${field.label}`}
            value={value}
            onInput={(val) => handleChange(field.key, val)}
          />
        );

      // Add other cases like date, multi-select, file, etc.
      case "date":
        return (
          <DateInput // https://rhinoroofers674.sharepoint.com/:w:/s/Operations/EWo953VxkHtLgwUcNPg2TGcB6jOSXhDKfFxV80mEMxtYiw?e=JpfLbL
            label={field.label}
            name={field.key}
            onChange={(val) => handleChange(field.key, val)}
            value={getDateInputValue(formValues[field.key])}
            format="long"
          />
        );

      case "file":
        return <Text>{`${field.label} (file upload placeholder)`}</Text>;

      case "file-url":
        return (
          <>
            <Input
              label={field.label}
              type="file"
              placeholder={`Enter ${field.label}`}
              accept=".pdf,.jpg,.png,.docx"
              disabled={true}
              onChange={(e) => handleFileUpload(e.target.files[0], field.key)}
            />
            {formValues[field.key] && (
              <Link href={value} target="_blank">
                View Uploaded File
              </Link>
            )}
          </>
        );

      case "multi-checkbox":
        return (
          <MultiSelect
            label={field.label}
            placeholder={`Enter ${field.label}`}
            options={dropdownOptions.job_type || []}
            value={
              typeof value === "string"
                ? value
                  ? value.split(";")
                  : null
                : Array.isArray(value)
                ? value
                : null
            }
            onChange={(val) => handleChange(field.key, val)}
          />
        );

      case "read-only":
        return (
          <Input
            label={field.label}
            placeholder={`Enter ${field.label}`}
            readOnly={true}
            value={value || ""}
            onInput={(val) => handleChange(field.key, val)}
          />
        );

      case "action-button":
        return (
          <>
            <Text></Text>
            <Button
              overlay={
                <Modal
                  id="third-round-needed"
                  title="3rd Round Financing Needed"
                  width="md"
                >
                  <ModalBody>
                    <Text>
                      Please fill in the reason that a Third Round of Financing
                      is needed.
                    </Text>
                    <TextArea
                      label={field.label}
                      name={field.modal.key}
                      value={formValues[field.modal.key] || ""}
                      placeholder={`Enter ${field.label}`}
                      onInput={(val) => handleChange(field.modal.key, val)}
                    />
                    <Text></Text>
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleSave({
                          [field.modal.key]: formValues[field.modal.key],
                        });
                        console.log(
                          "Third Financing: " + formValues[field.modal.key]
                        );
                        refreshObjectProperties();
                        close("third-round-needed");
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => close("third-round-needed")}
                    >
                      Cancel
                    </Button>
                  </ModalBody>
                </Modal>
              }
            >
              {field.label}
            </Button>
          </>
        );

      default:
        return <Text>{`No renderer for type: ${field.type}`}</Text>;
    }
  };

  return (
    <>
      {fieldConfig.map((section, i) => {
        if (section.section === "Financing - Round 2" && showMoreFinancingOptions) {
            return (
              <React.Fragment key={`section-${i}`}>
                <Text format={{ fontWeight: "bold", fontSize: "lg" }}>
                  {section.section}
                </Text>
                {section.fields.map((field, j) => (
                  <React.Fragment key={`field-${field.key}-${j}`}>
                    {renderField(field)}
                  </React.Fragment>
                ))}
                <Divider />
              </React.Fragment>
            );
          } else if (section.section === "Financing - Round 2") {
            return null;
          }

        return (
          <React.Fragment key={`section-${i}`}>
            <Text format={{ fontWeight: "bold", fontSize: "lg" }}>
              {section.section}
            </Text>
            {section.fields.map((field, j) => (
              <React.Fragment key={`field-${field.key}-${j}`}>
                {renderField(field)}
              </React.Fragment>
            ))}
            <Divider />
            <Text></Text>
          </React.Fragment>
        );
      })}
      <Text></Text>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
    </>
  );
};
