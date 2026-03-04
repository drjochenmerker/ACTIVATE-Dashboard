import { defineStore } from "pinia";
import { useSessionStore } from "./sessionStore";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { getMiscComments } from "@/data/knowledge_graph/read_operations";
import { Comment } from '@/data/knowledge_graph/structures';


export const useMiscsStore = defineStore("miscs", () => {
        const sessionStore = useSessionStore();
        const route = useRoute();
    // Reactive variable to hold miscellaneous comments
    const miscComments = ref<Comment[]>([]);
    const graph = sessionStore.sessionActivity!.graph;

    /**
     * Fetches miscellaneous comments from the knowledge graph when on the 'misc' page.
     * Updates the miscComments reactive reference with the retrieved comments.
     */
    const fetchMiscs = async () => {
        if (route.params.id === "misc") {
            // Get miscellaneous comments from the graph
            miscComments.value = await getMiscComments(graph);
        }
    };

/**
 * Promised function
 * Removes a specific comment from the miscellaneous comments list.
 * @param id The unique identifier of the comment to be removed.
 */
const removeComment = (id: string) => {
    miscComments.value = miscComments.value.filter(comment => comment.id !== id);
};
    return {
        fetchMiscs,
        miscComments,
        removeComment
    };
});
