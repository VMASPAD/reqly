// src/monaco-setup.ts
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker     from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import JsonWorker   from 'monaco-editor/esm/vs/language/json/json.worker?worker'

// Obligatorio: decirle a Monaco cómo crear cada worker
;(self as any).MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') return new JsonWorker()
    if (label === 'typescript' || label === 'javascript') return new TsWorker()
    return new EditorWorker()
  }
}

export default monaco
