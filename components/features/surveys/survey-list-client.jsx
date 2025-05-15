"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSurvey } from "@/lib/actions/survey.actions";
import {
  ClipboardList,
  Eye,
  MessageSquare,
  QrCode,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Helper function to get status badge variant
const getStatusBadge = (status) => {
  switch (status) {
    case "ACTIVE":
      return { variant: "success", label: "Active" };
    case "DRAFT":
      return { variant: "outline", label: "Draft" };
    case "ARCHIVED":
      return { variant: "secondary", label: "Archived" };
    default:
      return { variant: "outline", label: status };
  }
};

export default function SurveyListClient({ surveys }) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter surveys based on search term
  const filteredSurveys = surveys.filter((survey) =>
    survey.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete button click
  const handleDeleteClick = (survey) => {
    setSurveyToDelete(survey);
    setShowDeleteDialog(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!surveyToDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteSurvey(surveyToDelete.id);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Survey deleted successfully!",
        });

        // Refresh the page to show updated list
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              survey "{surveyToDelete?.name}" and all of its data, including
              questions and responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {surveys.length > 0 ? (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search surveys..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredSurveys.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSurveys.map((survey) => {
                const statusBadge = getStatusBadge(survey.status);
                return (
                  <Card key={survey.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="line-clamp-1">
                            {survey.name}
                          </CardTitle>
                          <CardDescription>
                            Created{" "}
                            {format(new Date(survey.createdAt), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" />
                          <span>
                            {survey._count.questions}{" "}
                            {survey._count.questions === 1
                              ? "question"
                              : "questions"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>
                            {survey._count.responseEntities}{" "}
                            {survey._count.responseEntities === 1
                              ? "response"
                              : "responses"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3 border-t flex justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-1"
                        >
                          <Link href={`/surveys/${survey.id}`}>
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleDeleteClick(survey)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="gap-1"
                      >
                        <Link href={`/surveys/${survey.id}#qr`}>
                          <QrCode className="h-4 w-4" />
                          <span>QR Code</span>
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No matching surveys</h3>
              <p className="text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No surveys yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first survey to start collecting feedback
          </p>
          <Button asChild className="mt-4">
            <Link href="/surveys/new">Create Survey</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
