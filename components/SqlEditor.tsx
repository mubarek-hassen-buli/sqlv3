"use client";

import React, { useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useDiagramStore } from '@/store/diagram.store';
// import { useTheme } from 'next-themes'; 

interface SqlEditorProps {
  className?: string;
}

export function SqlEditor({ className }: SqlEditorProps) {
  const { sql, setSql, analyze } = useDiagramStore();
  // const { theme } = useTheme();

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      // Configuration for SQL can go here if needed
    }
  }, [monaco]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSql(value);
      // Debounce analyze trigger could go here, or manual button
    }
  };

  return (
    <div className={`h-full w-full ${className}`}>
        <Editor
            height="100%"
            defaultLanguage="sql"
            value={sql}
            theme="vs-dark"
            onChange={handleEditorChange}
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                fontLigatures: true,
                automaticLayout: true,
                renderLineHighlight: "all",
            }}
        />
    </div>
  );
}
