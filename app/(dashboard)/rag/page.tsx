"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Search, Loader2, FileText } from "lucide-react"

interface RAGResult {
  answer: string
  context: string
  model: string
}

export default function RAGPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<RAGResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setUploadedDocs([...uploadedDocs, data.document.filename])
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleQuery = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Query error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sistema RAG</h2>
        <p className="text-gray-500">Geração Aumentada por Recuperação com embeddings locais.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar Documentos
            </CardTitle>
            <CardDescription>Adicione documentos à sua base de conhecimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-12 w-12 mx-auto text-gray-400 animate-spin mb-2" />
                ) : (
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                )}
                <p className="text-sm text-gray-600">
                  {uploading ? 'Enviando...' : 'Clique para enviar arquivos .txt ou .md'}
                </p>
              </label>
            </div>

            {uploadedDocs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Documentos Enviados:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {uploadedDocs.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Consultar Base de Conhecimento
            </CardTitle>
            <CardDescription>Faça perguntas sobre seus documentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você gostaria de saber?"
              rows={4}
            />
            <Button onClick={handleQuery} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resposta</CardTitle>
            <CardDescription>Modelo: {result.model}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Resposta:</p>
              <p className="text-gray-700 whitespace-pre-wrap">{result.answer}</p>
            </div>
            
            {result.context && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Contexto Recuperado:</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.context}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
