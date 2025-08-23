import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

const getVariantIcon = (variant: string) => {
	switch (variant) {
		case 'success':
			return <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />;
		case 'destructive':
			return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />;
		case 'warning':
			return <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />;
		default:
			return <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />;
	}
};

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{(toasts || []).map(({ id, title, description, action, variant = 'default', ...props }) => {
				return (
					<Toast key={id} variant={variant} {...props}>
						{getVariantIcon(variant)}
						<div className="flex-1 pr-8">
							{title && <ToastTitle className="text-sm font-semibold mb-1">{title}</ToastTitle>}
							{description && (
								<ToastDescription className="text-sm opacity-90">{description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}
