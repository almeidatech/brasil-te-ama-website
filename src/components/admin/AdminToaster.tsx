import { Toaster } from 'sonner';

export default function AdminToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{ style: { fontFamily: 'inherit' } }}
    />
  );
}
