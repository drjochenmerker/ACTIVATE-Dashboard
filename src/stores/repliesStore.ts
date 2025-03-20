import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRepliesStore = defineStore('Replies', () => {
    let repliesDetails = ref<Record<string, any[]>>({});

    const addReply = (conflictId: string, reply: any) => {
        if (!repliesDetails.value[conflictId]) {
            repliesDetails.value[conflictId] = [];
        }
        repliesDetails.value[conflictId].push(reply);
    };

    const removeReply = (conflictId: string, replyId: string) => {
        const replies = repliesDetails.value[conflictId];
    
        if (replies) {
            const index = replies.findIndex(reply => reply.id === replyId);
            if (index !== -1) {
                replies.splice(index, 1);
                
                // Reassign the replies array to a new reference to trigger reactivity
                repliesDetails.value = { ...repliesDetails.value }; // This will ensure the store reactivity
    
                // Optionally clean up if there are no replies left for the conflictId
                if (replies.length === 0) {
                    delete repliesDetails.value[conflictId];
                }
            }
        }
    };
    

    const getReplies = () => {
        return repliesDetails.value;
    };

    return {
        addReply,
        removeReply,
        getReplies
    };
});
