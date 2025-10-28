"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ConversationsList } from "@/components/projects/ConversationsList";
import { FileDetailsModal } from "@/components/projects/FileDetailsModal";
import { KnowledgeBaseSidebar } from "@/components/projects/KnowledgeBaseSidebar";
import { Project, Chat, ProjectDocument, ProjectSettings } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { NotFound } from "@/components/ui/NotFound";

interface ProjectData {
  project: Project | null;
  chats: Chat[];
  documents: ProjectDocument[];
  settings: ProjectSettings | null;
}

const ProjectPage: React.FC = () => {
  const params = useParams();
  const projectId = params?.id as string;
  const { getToken, userId } = useAuth();

  // * Data States - What data we're tracking
  const [data, setData] = useState<ProjectData>({
    project: null,
    chats: [],
    documents: [],
    settings: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // * UI States - How the interface looks and behaves
  const [activeTab, setActiveTab] = useState<"documents" | "settings">(
    "documents"
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  /*
  ! Business Logic Functions - Core operations for this project:
  * - loadProjectData: Load all project data from the server

  * - handleCreateNewChat: Create a new conversation in this project
  * - handleDeleteChat: Remove a conversation from the project
  * - handleDocumentUpload: Process and add new documents to knowledge base
  * - handleDocumentDelete: Remove documents from knowledge base
  * - handleUrlAdd: Add web content to the knowledge base
  * - handleDraftSettings: Update project configuration locally
  * - handlePublishSettings: Save project settings to the server
  */

  useEffect(() => {
    const loadProjectData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const [projectRes, chatsRes, documentsRes, settingsRes] =
          await Promise.all([
            apiClient.get(`/api/project/${projectId}`, token),
            apiClient.get(`/api/project/${projectId}/chats`, token),
            apiClient.get(`/api/project/${projectId}/files`, token),
            apiClient.get(`/api/project/${projectId}/settings`, token),
          ]);

        setData({
          project: projectRes.data,
          chats: chatsRes.data,
          documents: documentsRes.data,
          settings: settingsRes.data,
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch data";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    loadProjectData();
  }, [userId, projectId, getToken]);

  const handleCreateNewChat = async () => {
    if (!userId) return;

    try {
      setIsCreatingChat(true);
      const token = await getToken();
      const chatNumber = Date.now() % 10000; // Generate a random chat number

      const response = await apiClient.post(
        "/api/chat/create",
        {
          title: `Chat #${chatNumber}`,
          project_id: projectId,
        },
        token
      );

      const savedChat = response?.data;

      // Update local state
      setData((prev) => ({
        ...prev,
        chats: [savedChat, ...prev.chats],
      }));

      toast.success("Chat Created successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create chat";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!userId) return;
    try {
      const token = await getToken();
      await apiClient.delete(`/api/chat/delete/${chatId}`, token);

      setData((prev) => ({
        ...prev,
        chats: prev.chats.filter((chat) => chat.id !== chatId),
      }));
      toast.success("Chat deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete chat";
      toast.error(errorMessage);
    }
  };

  const handleDocumentUpload = async (files: File[]) => {
    console.log("Upload files", files);
  };

  const handleDocumentDelete = async (documentId: string) => {
    console.log("Document Deleted");
  };

  const handleUrlAdd = async (url: string) => {
    console.log("Add URL", url);
  };

  const handleDraftSettings = (updates: any) => {
    console.log("Update local state with draft settings", updates);
  };

  const handlePublishSettings = async () => {
    console.log("Make API call to publish settings");
  };

  /*
  ! User Interaction Functions:
  * - handleChatClick: Navigate to a specific conversation when clicked
  * - handleOpenDocument: Show document details when user selects it
  */

  const handleChatClick = (chatId: string) => {
    console.log("Navigate to chat:", chatId);
  };

  const handleOpenDocument = (documentId: string) => {
    console.log("Open document", documentId);
    setSelectedDocumentId(documentId);
  };

  //
  const selectedDocument = selectedDocumentId
    ? data.documents.find((doc) => doc.id == selectedDocumentId)
    : null;

  if (loading) {
    return <LoadingSpinner message="Loading Project Data..." />;
  }

  if (error) {
    return <NotFound message={error} />;
  }

  return (
    <>
      <div className="flex h-screen bg-black gap-4 p-4">
        <ConversationsList
          project={data.project as Project}
          conversations={data.chats}
          error={null}
          loading={false}
          onCreateNewChat={handleCreateNewChat}
          onChatClick={handleChatClick}
          onDeleteChat={handleDeleteChat}
        />

        {/* KnowledgeBase Sidebar */}
        <KnowledgeBaseSidebar
          activeTab={activeTab}
          onSetActiveTab={setActiveTab}
          projectDocuments={data.documents}
          onDocumentUpload={handleDocumentUpload}
          onDocumentDelete={handleDocumentDelete}
          onOpenDocument={handleOpenDocument}
          onUrlAdd={handleUrlAdd}
          projectSettings={data.settings as ProjectSettings}
          settingsError={null}
          settingsLoading={false}
          onUpdateSettings={handleDraftSettings}
          onApplySettings={handlePublishSettings}
        />
      </div>
      {selectedDocument && (
        <FileDetailsModal
          document={selectedDocument}
          onClose={() => setSelectedDocumentId(null)}
        />
      )}
    </>
  );
};

export default ProjectPage;
