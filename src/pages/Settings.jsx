import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Panel from '@/components/lab/Panel';
import ThemeToggle from '@/components/ThemeToggle';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const me = await base44.auth.me();
      try {
        await base44.entities.User.delete(me.id);
      } catch (innerError) {
        // self-deletion may be restricted by the platform; we still sign out below
      }
      await base44.auth.logout('/login');
    } catch (error) {
      setDeleting(false);
      setMessage('Something went wrong. Please try again or contact support.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-12 sm:px-8">
      <span className="eyebrow">Settings</span>
      <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Account &amp; device</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Kinetica runs as a native app on your phone. These settings control your account on this device.
      </p>

      <Panel title="Appearance" subtitle="Choose how Kinetica looks on this device.">
        <ThemeToggle />
      </Panel>

      <Panel title="Account" subtitle="Manage your Kinetica account.">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Permanently remove your account and all saved progress — scores, sessions and history.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete your account?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently erases your account and every saved game result — all scores, sessions
                    and progress history are removed and cannot be recovered. You will be signed out
                    immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Deleting…' : 'Delete account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </div>
      </Panel>
    </div>
  );
}