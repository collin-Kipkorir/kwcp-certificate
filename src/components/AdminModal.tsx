import { useRef, useState } from "react";
import { toast } from "sonner";
import { FiDownload, FiUpload, FiRefreshCw } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loginAdminUser, logoutAdminUser, type AdminUser } from "@/utils/adminAuth";
import { exportStorage, importStorage } from "@/utils/localStorage";
import type { AdminSettings } from "@/types/Certificate";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AdminSettings;
  onSave: (s: AdminSettings) => void;
  onResetCounter: () => void;
  onImported: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function AdminModal({
  open,
  onOpenChange,
  settings,
  onSave,
  onResetCounter,
  onImported,
}: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const adminUser = await loginAdminUser(email, password);
      setAdmin(adminUser);
      setUnlocked(true);
      setPassword("");
      toast.success(`Welcome, ${adminUser.fullName}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutAdminUser();
    setAdmin(null);
    setUnlocked(false);
    setEmail("");
    setPassword("");
    toast.success("Logged out");
  };

  const handleUpload = async (
    file: File | undefined,
    key: "logo" | "signature" | "seal" | "watermark",
    label: string,
  ): Promise<void> => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2_000_000) {
      toast.error("Image must be smaller than 2 MB");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onSave({ ...settings, [key]: dataUrl });
      toast.success(`${label} uploaded`);
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportStorage()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "certificate-portal-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Data exported");
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      importStorage(await file.text());
      onImported();
      toast.success("Data imported");
    } catch {
      toast.error("Invalid backup file");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setUnlocked(false);
          setPassword("");
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Admin Settings</DialogTitle>
          <DialogDescription>
            Manage branding, signature and stored certificate data.
          </DialogDescription>
        </DialogHeader>

        {!unlocked ? (
          <form
            className="space-y-4"
            onSubmit={handleLogin}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Unlock"}
            </Button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">
                Logged in as: <span className="font-semibold">{admin?.fullName}</span>
              </p>
              <p className="text-xs text-muted-foreground">{admin?.email}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="mt-2"
              >
                Logout
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-logo">Organization Logo</Label>
                <Input
                  id="admin-logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0], "logo", "Logo")}
                />
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo preview" className="h-12 object-contain" />
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-signature">Authorized Signature</Label>
                <Input
                  id="admin-signature"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0], "signature", "Signature")}
                />
                {settings.signature ? (
                  <img
                    src={settings.signature}
                    alt="Signature preview"
                    className="h-12 object-contain"
                  />
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-seal">Official Seal</Label>
                <Input
                  id="admin-seal"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0], "seal", "Seal")}
                />
                {settings.seal ? (
                  <img src={settings.seal} alt="Seal preview" className="h-12 object-contain" />
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-watermark">Watermark Logo</Label>
                <Input
                  id="admin-watermark"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0], "watermark", "Watermark")}
                />
                {settings.watermark ? (
                  <img
                    src={settings.watermark}
                    alt="Watermark preview"
                    className="h-12 object-contain"
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-org">Organization Name</Label>
              <Input
                id="admin-org"
                value={settings.organization}
                maxLength={60}
                onChange={(e) => onSave({ ...settings, organization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-ministry">Ministry Name</Label>
              <Input
                id="admin-ministry"
                value={settings.ministry}
                maxLength={60}
                onChange={(e) => onSave({ ...settings, ministry: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paylor-api">Paylor API Key</Label>
                <Input
                  id="paylor-api"
                  type="password"
                  value={settings.paylorApiKey ?? ""}
                  placeholder="sk_live_..."
                  onChange={(e) => onSave({ ...settings, paylorApiKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paylor-channel">Paylor Channel ID</Label>
                <Input
                  id="paylor-channel"
                  value={settings.paylorChannelId ?? ""}
                  placeholder="PAYL-XXXXXX"
                  onChange={(e) => onSave({ ...settings, paylorChannelId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="outline" onClick={onResetCounter}>
                <FiRefreshCw className="mr-2 h-4 w-4" /> Reset No.
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <FiDownload className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button variant="outline" onClick={() => importRef.current?.click()}>
                <FiUpload className="mr-2 h-4 w-4" /> Import
              </Button>
              <input
                ref={importRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => handleImport(e.target.files?.[0])}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}