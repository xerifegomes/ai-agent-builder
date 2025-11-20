"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bot, ArrowRight, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface OllamaModel {
  name: string
  size: number
}

interface FormData {
  name: string
  description: string
  model: string
  prompt: string
  webSearch: boolean
  codeInterpreter: boolean
}

export default function NewAgentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    model: '',
    prompt: '',
    webSearch: false,
    codeInterpreter: false,
  })
  const [files, setFiles] = useState<File[]>([])

  // Carrega modelos Ollama disponíveis
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api/ollama/models')
        const data = await response.json()
        if (data.models) {
          const modelNames = data.models.map((m: OllamaModel) => m.name)
          setModels(modelNames)
          if (modelNames.length > 0) {
            setFormData(prev => ({ ...prev, model: modelNames[0] }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [])

  // Validação de campos
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Nome do agente é obrigatório'
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Descrição é obrigatória'
      }
      if (!formData.model) {
        newErrors.model = 'Selecione um modelo'
      }
    }

    if (currentStep === 2) {
      if (!formData.prompt.trim()) {
        newErrors.prompt = 'Instruções do sistema são obrigatórias'
      } else if (formData.prompt.trim().length < 20) {
        newErrors.prompt = 'Instruções devem ter pelo menos 20 caracteres'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Avançar para próximo passo
  const handleNext = (nextStep: number) => {
    if (validateStep(step)) {
      setStep(nextStep)
      setErrors({})
    }
  }

  // Salvar agente
  const handleSave = async () => {
    if (!validateStep(3)) return

    setSaving(true)
    try {
      // 1. Criar Agente
      const agentData = {
        ...formData,
        systemPrompt: formData.prompt
      }

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create agent')
      }

      const agent = await response.json()

      // 2. Upload de Arquivos (se houver)
      if (files.length > 0) {
        for (const file of files) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)
          uploadFormData.append('agentId', agent.id)

          try {
            await fetch('/api/documents/upload', {
              method: 'POST',
              body: uploadFormData,
            })
          } catch (uploadError) {
            console.error(`Failed to upload file ${file.name}:`, uploadError)
            // Não interrompe o fluxo, apenas loga o erro
          }
        }
      }

      // Redireciona para a página do agente criado
      router.push(`/agents/${agent.id}`)
    } catch (error) {
      console.error('Failed to save agent:', error)
      setErrors({ save: 'Erro ao salvar agente. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Criar Novo Agente</h2>
        <p className="text-gray-500">Configure a personalidade e capacidades do seu assistente de IA.</p>
      </div>

      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => step > 1 && setStep(1)}
          disabled={step === 1}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            } ${step > 1 ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          title="Identidade"
        >
          1
        </button>
        <div className={`h-1 flex-1 transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <button
          onClick={() => step > 2 && validateStep(1) && setStep(2)}
          disabled={step < 2}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            } ${step > 2 ? 'cursor-pointer hover:scale-110' : step === 2 ? 'cursor-default' : 'cursor-not-allowed'}`}
          title="Prompt"
        >
          2
        </button>
        <div className={`h-1 flex-1 transition-all ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <button
          onClick={() => step > 3 && validateStep(2) && setStep(3)}
          disabled={step < 3}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            } ${step === 3 ? 'cursor-default' : 'cursor-not-allowed'}`}
          title="Ferramentas"
        >
          3
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identidade do Agente</CardTitle>
          <CardDescription>Defina as informações básicas sobre seu agente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              Nome do Agente
              {formData.name.trim() && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              id="name"
              placeholder="ex: Bot de Suporte 3000"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              Descrição
              {formData.description.trim() && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            <Textarea
              id="description"
              placeholder="O que este agente faz?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model" className="flex items-center gap-2">
              Modelo Base (Ollama)
              {formData.model && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Label>
            {loadingModels ? (
              <div className="flex items-center justify-center h-10 border border-gray-200 rounded-md bg-gray-50">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            ) : models.length === 0 ? (
              <div className="flex items-center h-10 px-3 border border-red-200 rounded-md bg-red-50 text-sm text-red-600">
                ⚠️ Nenhum modelo Ollama encontrado. Inicie o Ollama.
              </div>
            ) : (
              <select
                id="model"
                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${errors.model ? 'border-red-500' : 'border-gray-200'
                  }`}
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              >
                {models.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            )}
            {errors.model && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.model}
              </p>
            )}
            <p className="text-xs text-gray-500">Modelos locais hospedados via Ollama</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled>Voltar</Button>
          <Button onClick={() => handleNext(2)}>
            Próximo Passo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Card className={step < 2 ? "opacity-50 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle>Prompt do Sistema</CardTitle>
          <CardDescription>Instrua a IA sobre como se comportar e quais regras seguir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Instruções do Sistema
                {formData.prompt.trim().length >= 20 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              </span>
              <span className="text-xs text-gray-400">
                {formData.prompt.length} caracteres
              </span>
            </Label>
            <Textarea
              id="prompt"
              className={`min-h-[200px] font-mono text-sm ${errors.prompt ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              placeholder="Você é um assistente de suporte prestativo. Você responde perguntas sobre..."
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            />
            {errors.prompt && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.prompt}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Defina como o agente deve se comportar e responder. Mínimo de 20 caracteres.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
          <Button onClick={() => handleNext(3)}>
            Próximo Passo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Card className={step < 3 ? "opacity-50 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle>Conhecimento & Ferramentas</CardTitle>
          <CardDescription>Conecte fontes de dados e habilite capacidades.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(Array.from(e.target.files))
                }
              }}
            />
            <div className="mx-auto h-12 w-12 text-gray-400 mb-2">
              <Bot className="h-12 w-12" />
            </div>
            <p className="text-sm text-gray-600">
              {files.length > 0
                ? `${files.length} arquivo(s) selecionado(s)`
                : "Arraste e solte arquivos aqui para treinar seu agente (TXT)"}
            </p>
            {files.length > 0 && (
              <ul className="mt-2 text-xs text-gray-500">
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label>Capacidades</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="web-search"
                className="rounded border-gray-300"
                checked={formData.webSearch}
                onChange={(e) => setFormData({ ...formData, webSearch: e.target.checked })}
              />
              <label htmlFor="web-search" className="text-sm">Busca na Web</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="code-interpreter"
                className="rounded border-gray-300"
                checked={formData.codeInterpreter}
                onChange={(e) => setFormData({ ...formData, codeInterpreter: e.target.checked })}
              />
              <label htmlFor="code-interpreter" className="text-sm">Interpretador de Código</label>
            </div>
          </div>
          {errors.save && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.save}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Criar Agente
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
