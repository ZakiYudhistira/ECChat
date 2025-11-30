import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { addContact } from "../../controller/Contact";
import { toast } from "sonner";

interface AddContactDialogProps {
	onContactAdded?: () => void;
}

export function AddContactDialog({ onContactAdded }: AddContactDialogProps) {
	const [open, setOpen] = useState(false);
	const [contactUsername, setContactUsername] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const showToast = (message: string, type: "success" | "error" = "success") => {
		// Simple toast replacement - you can integrate with your toast library
		if (type === "success") {
            toast.success(message);
		} else {
			toast.error(message);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!contactUsername.trim()) {
			setError("Username is required");
			return;
		}

		if (contactUsername.length < 3) {
			setError("Username must be at least 3 characters");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			await addContact(contactUsername.trim());
			showToast(`Contact "${contactUsername}" added successfully!`);
			setContactUsername("");
			setOpen(false);
			onContactAdded?.();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Failed to add contact";
			setError(errorMessage);
			showToast(errorMessage, "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setContactUsername("");
			setError("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition"
					aria-label="Add new contact"
				>
					<UserPlus className="w-5 h-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="text-primary glow-primary">Add New Contact</DialogTitle>
					<DialogDescription>
						Enter the username of the person you want to add to your contacts.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 p-6">
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							placeholder="Enter username"
							value={contactUsername}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								setContactUsername(e.target.value);
								setError("");
							}}
							className="w-full"
							disabled={isLoading}
							autoComplete="off"
						/>
						{error && <p className="text-sm text-destructive">{error}</p>}
					</div>
				</form>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						onClick={handleSubmit}
						disabled={isLoading || !contactUsername.trim()}
					>
						{isLoading ? "Adding..." : "Add Contact"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}