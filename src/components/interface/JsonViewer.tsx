import React from "react";
import ReactJson from "react-json-view";
import { Box, Button, useClipboard } from "@chakra-ui/react";

interface JsonViewerProps {
  value: any;
  collapsed?: number;
  style?: React.CSSProperties;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  value,
  collapsed = 2,
  style = { fontSize: '14px', background: '#f9fafb', borderRadius: '8px', padding: '12px' },
}) => {
  const parsedValue = (() => {
    try {
      let data = value;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return { raw: data };
        }
      }
      return data;
    } catch {
      return { raw: String(value) };
    }
  })();

  const jsonString = (() => {
    try {
      return JSON.stringify(parsedValue, null, 2);
    } catch {
      return String(parsedValue);
    }
  })();

  const { hasCopied, onCopy } = useClipboard(jsonString);

  return (
    <Box position="relative">
      <Button
        size="xs"
        position="absolute"
        top={2}
        right={2}
        zIndex={1}
        onClick={onCopy}
        variant="outline"
      >
        {hasCopied ? "Copied!" : "Copy"}
      </Button>
      <ReactJson
        src={parsedValue}
        name={false}
        collapsed={collapsed}
        enableClipboard={false}
        displayDataTypes={false}
        style={{ ...style, paddingTop: "32px" }}
      />
    </Box>
  );
};