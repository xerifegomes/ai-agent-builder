import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-gray-500">Manage your account and workspace preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your workspace information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input id="workspace-name" defaultValue="My Awesome Agents" />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage API keys for accessing your agents programmatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Default API Key</Label>
            <div className="flex gap-2">
              <Input id="api-key" value="sk_live_51Mz..." readOnly className="font-mono" />
              <Button variant="outline">Copy</Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">Revoke Key</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
