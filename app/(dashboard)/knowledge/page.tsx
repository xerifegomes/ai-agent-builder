import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileText, Upload, Trash2, Search } from "lucide-react"

export default function KnowledgePage() {
  const documents = [
    { id: 1, name: "Política da Empresa 2024.pdf", size: "2.4 MB", date: "24 Out, 2024", status: "Indexado" },
    { id: 2, name: "Manual do Produto v2.docx", size: "1.1 MB", date: "22 Out, 2024", status: "Indexado" },
    { id: 3, name: "Lista de FAQs.txt", size: "45 KB", date: "20 Out, 2024", status: "Processando" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h2>
          <p className="text-gray-500">Gerencie os documentos e dados que seus agentes usam como contexto.</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Enviar Documento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>
            Os arquivos enviados aqui serão processados e disponibilizados para seus agentes consultarem.
          </CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input className="pl-9" placeholder="Buscar documentos..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tamanho</th>
                  <th className="px-4 py-3">Data de Adição</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {doc.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{doc.size}</td>
                    <td className="px-4 py-3 text-gray-500">{doc.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        doc.status === 'Indexado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
