<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CirclePlus } from 'lucide-vue-next';
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button class="fixed bottom-6 right-6"> <CirclePlus class="w-4 h-4 mr-2" /> Add misc note </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add new item</DialogTitle>
                <DialogDescription> Add a new node to the triangle graph </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Skeleton class="h-4 w-[60px] col-span-1" />
                    <Skeleton class="h-8 col-span-3" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Skeleton class="h-4 w-[80px] col-span-1" />
                    <Skeleton class="h-8 col-span-3" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Skeleton class="h-4 w-[70px] col-span-1" />
                    <Skeleton class="h-8 col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose>
                    <Button type="submit"> Add </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
