"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Trash2, Download, CheckCircle2, XCircle, Loader2, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface TestCase {
  id: string
  input: string
  expectedOutput: string | null
  keywords: string[]
  description: string | null
  executions: Array<{
    passed: boolean
    duration: number
    executedAt: Date
  }>
}

interface TestManagerProps {
  agentId: string
}

export function TestManager({ agentId }: TestManagerProps) {
  const [tests, setTests] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [editingTest, setEditingTest] = useState<TestCase | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    input: "",
    expectedOutput: "",
    keywords: "",
    description: "",
  })

  const loadTests = async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/tests`)
      const data = await res.json()
      setTests(data)
    } catch (error) {
      console.error("Error loading tests:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

  const createTest = async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: formData.input,
          expectedOutput: formData.expectedOutput || null,
          keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
          description: formData.description || null,
        }),
      })
      
      if (res.ok) {
        await loadTests()
        setFormData({ input: "", expectedOutput: "", keywords: "", description: "" })
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating test:", error)
    }
  }

  const updateTest = async () => {
    if (!editingTest) return

    try {
      const res = await fetch(`/api/agents/${agentId}/tests/${editingTest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: formData.input,
          expectedOutput: formData.expectedOutput || null,
          keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
          description: formData.description || null,
        }),
      })
      
      if (res.ok) {
        await loadTests()
        setEditingTest(null)
        setFormData({ input: "", expectedOutput: "", keywords: "", description: "" })
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating test:", error)
    }
  }

  const deleteTest = async (testId: string) => {
    if (!confirm("Tem certeza que deseja deletar este teste?")) return

    try {
      const res = await fetch(`/api/agents/${agentId}/tests/${testId}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        await loadTests()
      }
    } catch (error) {
      console.error("Error deleting test:", error)
    }
  }

  const executeTest = async (testId: string) => {
    setExecuting(testId)
    try {
      const res = await fetch(`/api/agents/${agentId}/tests/${testId}/execute`, {
        method: "POST",
      })
      
      if (res.ok) {
        await loadTests()
      }
    } catch (error) {
      console.error("Error executing test:", error)
    } finally {
      setExecuting(null)
    }
  }

  const exportTests = async (format: "json" | "csv") => {
    try {
      const res = await fetch(`/api/agents/${agentId}/tests/export?format=${format}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tests-${agentId}.${format}`
      a.click()
    } catch (error) {
      console.error("Error exporting tests:", error)
    }
  }

  const openCreateDialog = () => {
    setEditingTest(null)
    setFormData({ input: "", expectedOutput: "", keywords: "", description: "" })
    setIsDialogOpen(true)
  }

  const openEditDialog = (test: TestCase) => {
    setEditingTest(test)
    setFormData({
      input: test.input,
      expectedOutput: test.expectedOutput || "",
      keywords: test.keywords.join(", "),
      description: test.description || "",
    })
    setIsDialogOpen(true)
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Testes Personalizáveis</h3>
          <p className="text-sm text-muted-foreground">
            {tests.length} {tests.length === 1 ? "teste" : "testes"} configurado{tests.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportTests("json")}>
            <Download className="mr-2 h-4 w-4" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportTests("csv")}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Teste
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTest ? "Editar Teste" : "Criar Novo Teste"}</DialogTitle>
                <DialogDescription>
                  Configure o teste para validar o comportamento do agente
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="input">Entrada do Teste</Label>
                  <Textarea
                    id="input"
                    placeholder="Ex: Olá, como você pode me ajudar?"
                    value={formData.input}
                    onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="expectedOutput">Saída Esperada (opcional)</Label>
                  <Textarea
                    id="expectedOutput"
                    placeholder="Texto que deve aparecer na resposta"
                    value={formData.expectedOutput}
                    onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">Palavras-chave (opcional, separadas por vírgula)</Label>
                  <Input
                    id="keywords"
                    placeholder="Ex: ajuda, assistente, funcionalidades"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O teste passa se qualquer palavra-chave aparecer na resposta
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Ex: Verifica apresentação inicial do agente"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingTest ? updateTest : createTest}>
                  {editingTest ? "Salvar Alterações" : "Criar Teste"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {tests.map((test) => {
          const lastExecution = test.executions[0]
          const isExecuting = executing === test.id

          return (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{test.input}</CardTitle>
                    {test.description && (
                      <CardDescription>{test.description}</CardDescription>
                    )}
                  </div>
                  {lastExecution && (
                    <Badge variant={lastExecution.passed ? "default" : "destructive"}>
                      {lastExecution.passed ? (
                        <><CheckCircle2 className="mr-1 h-3 w-3" /> Passou</>
                      ) : (
                        <><XCircle className="mr-1 h-3 w-3" /> Falhou</>
                      )}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {test.expectedOutput && (
                    <div className="text-sm">
                      <span className="font-medium">Saída Esperada:</span> {test.expectedOutput}
                    </div>
                  )}
                  
                  {test.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm font-medium mr-2">Keywords:</span>
                      {test.keywords.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {lastExecution && (
                    <div className="text-xs text-muted-foreground">
                      Última execução: {new Date(lastExecution.executedAt).toLocaleString()} 
                      {" • "}
                      {lastExecution.duration}ms
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => executeTest(test.id)}
                      disabled={isExecuting}
                    >
                      {isExecuting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Executando</>
                      ) : (
                        <><Play className="mr-2 h-4 w-4" /> Executar</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(test)}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTest(test.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {tests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhum teste criado ainda</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Teste
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
