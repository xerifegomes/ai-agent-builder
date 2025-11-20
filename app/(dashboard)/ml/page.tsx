"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Upload, Zap, Database, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function MLPage() {
  const [loraConfig, setLoraConfig] = useState({
    baseModel: 'llama3.1:8b',
    rank: 8,
    alpha: 16,
    dropout: 0.1,
  })
  const [isTraining, setIsTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")

  const startTraining = () => {
    setIsTraining(true)
    setProgress(0)
    setStatus("Inicializando ambiente de treinamento...")

    // Simulação de fluxo de treinamento
    const steps = [
      { p: 10, s: "Carregando modelo base..." },
      { p: 25, s: "Preparando dataset..." },
      { p: 40, s: "Inicializando adaptadores LoRA..." },
      { p: 60, s: "Treinando época 1/3..." },
      { p: 80, s: "Treinando época 2/3..." },
      { p: 95, s: "Treinando época 3/3..." },
      { p: 100, s: "Treinamento concluído!" }
    ]

    let currentStep = 0

    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval)
        setTimeout(() => {
          setIsTraining(false)
          setStatus("")
        }, 2000)
        return
      }

      setProgress(steps[currentStep].p)
      setStatus(steps[currentStep].s)
      currentStep++
    }, 1000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">ML & Ajuste Fino</h2>
        <p className="text-gray-500">Ajuste fino LoRA e otimização de modelos para Ollama.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Configuração LoRA
            </CardTitle>
            <CardDescription>Configurações de Adaptação de Baixa Classificação para ajuste fino eficiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base-model">Modelo Base</Label>
              <select
                id="base-model"
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                value={loraConfig.baseModel}
                onChange={(e) => setLoraConfig({ ...loraConfig, baseModel: e.target.value })}
              >
                <option>llama3.1:8b</option>
                <option>qwen2.5-coder:7b</option>
                <option>deepseek-coder:6.7b</option>
                <option>phi3:medium</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rank">Classificação LoRA (r)</Label>
              <Input
                id="rank"
                type="number"
                value={loraConfig.rank}
                onChange={(e) => setLoraConfig({ ...loraConfig, rank: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500">Classificação menor = treinamento mais rápido, menos capacidade</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alpha">LoRA Alpha (α)</Label>
              <Input
                id="alpha"
                type="number"
                value={loraConfig.alpha}
                onChange={(e) => setLoraConfig({ ...loraConfig, alpha: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500">Fator de escala, tipicamente 2x a classificação</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropout">Taxa de Dropout</Label>
              <Input
                id="dropout"
                type="number"
                step="0.01"
                value={loraConfig.dropout}
                onChange={(e) => setLoraConfig({ ...loraConfig, dropout: parseFloat(e.target.value) })}
              />
            </div>

            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Zap className="mr-2 h-4 w-4" />
              Inicializar Adaptador LoRA
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dados de Treinamento
            </CardTitle>
            <CardDescription>Envie conjunto de dados para ajuste fino (formato JSONL)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
              <Database className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Clique para enviar dados de treinamento</p>
              <p className="text-xs text-gray-400 mt-2">Formato: JSONL com pares prompt/conclusão</p>
            </div>

            <div className="space-y-2">
              <Label>Parâmetros de Treinamento</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="epochs" className="text-xs">Épocas</Label>
                  <Input id="epochs" type="number" defaultValue="3" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="batch-size" className="text-xs">Tamanho do Lote</Label>
                  <Input id="batch-size" type="number" defaultValue="4" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="learning-rate" className="text-xs">Taxa de Aprendizado</Label>
                  <Input id="learning-rate" type="number" step="0.00001" defaultValue="0.0001" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="warmup" className="text-xs">Passos de Aquecimento</Label>
                  <Input id="warmup" type="number" defaultValue="100" className="mt-1" />
                </div>
              </div>
            </div>

            {isTraining ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{status}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            ) : (
              <Button className="w-full" onClick={startTraining}>
                <Zap className="mr-2 h-4 w-4" />
                Iniciar Treinamento
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações LoRA</CardTitle>
          <CardDescription>Adaptação de Baixa Classificação para Grandes Modelos de Linguagem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>LoRA</strong> permite ajustar modelos grandes de forma eficiente, treinando apenas pequenas camadas adaptadoras,
              reduzindo os requisitos de memória em até 10x enquanto mantém o desempenho.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Treine em GPUs de consumidor (RTX 3090, 4090)</li>
              <li>Ajuste fino de modelos em minutos em vez de horas</li>
              <li>Mescle adaptadores de volta ao modelo base ou carregue dinamicamente</li>
              <li>Perfeito para customização específica de domínio</li>
            </ul>
            <p className="text-xs text-gray-500 pt-2">
              Nota: A integração com a API de ajuste fino do Ollama está chegando em breve. Por enquanto, use ferramentas externas como
              <code className="bg-gray-100 px-1 py-0.5 rounded mx-1">unsloth</code> ou
              <code className="bg-gray-100 px-1 py-0.5 rounded mx-1">axolotl</code> e importe o resultado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
