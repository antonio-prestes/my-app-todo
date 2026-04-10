"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CircleIcon } from "lucide-react";
import { updateTaskStatus } from "@/app/actions/tasks";
import { PriorityChip } from "@/components/task-detail-modal";
import { TaskDetailModal } from "@/components/task-detail-modal";

// Types
import { schema } from "./data-table";
import { z } from "zod";

type Task = z.infer<typeof schema>;
type Status = Task["status"];

const STATUSES: Status[] = ["Todo", "InProgress", "Review", "Done"];

// Kanban Item Component — redesigned to match reference image
function KanbanItem({
  task,
  isDragging,
  onTitleClick,
}: {
  task: Task;
  isDragging?: boolean;
  onTitleClick?: () => void;
}) {
  return (
    <div
      className={`mb-3 cursor-grab active:cursor-grabbing rounded-xl border bg-card p-4 shadow-sm transition-all
        ${isDragging ? "opacity-30 scale-95" : "hover:shadow-md hover:-translate-y-0.5"}`}
    >
      <div className="flex flex-col gap-3">
        {/* Priority Chip */}
        <div>
          <PriorityChip priority={task.priority} />
        </div>

        {/* Title - clickable to open detail */}
        <h4
          className="font-semibold text-sm leading-snug cursor-pointer hover:text-primary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onTitleClick?.();
          }}
        >
          {task.title}
        </h4>

        {/* Description preview */}
        {(task as any).description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {(task as any).description}
          </p>
        )}

        {/* Footer: Avatar + Name + Tags */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <Avatar className="size-6 ring-2 ring-background">
              <AvatarImage src={(task as any).assigneeAvatar} alt={task.assignee} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {task.assignee?.substring(0, 2)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {task.assignee}
            </span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end max-w-[100px]">
            {(task.tags || []).slice(0, 2).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="font-normal text-[10px] py-0.5 px-1.5 rounded-md">
                {tag}
              </Badge>
            ))}
            {(task.tags || []).length > 2 && (
              <Badge variant="outline" className="font-normal text-[10px] py-0.5 px-1.5 rounded-md">
                +{(task.tags || []).length - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sortable wrapper
function SortableTask({ task, onTitleClick }: { task: Task; onTitleClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "Task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanItem task={task} isDragging={isDragging} onTitleClick={onTitleClick} />
    </div>
  );
}

// Column Component
function KanbanColumn({ status, tasks, onTaskClick }: { status: Status; tasks: Task[]; onTaskClick: (task: Task) => void }) {
  const tFields = useTranslations("TaskFields");
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex w-72 flex-col rounded-xl bg-muted/40 p-4 border border-transparent">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {status === "Done" && (
            <CircleIcon className="size-3 fill-green-500 text-green-500" />
          )}
          {status === "InProgress" && (
            <CircleIcon className="size-3 fill-blue-500 text-blue-500" />
          )}
          {status === "Review" && (
            <CircleIcon className="size-3 fill-yellow-500 text-yellow-500" />
          )}
          {status === "Todo" && (
            <CircleIcon className="size-3 text-muted-foreground" />
          )}
          {tFields(status)}
        </h3>
        <Badge
          variant="secondary"
          className="rounded-full text-xs font-normal px-2"
        >
          {tasks.length}
        </Badge>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex flex-1 flex-col min-h-[150px]">
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onTitleClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ data }: { data: Task[] }) {
  const [tasks, setTasks] = React.useState<Task[]>(data);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  React.useEffect(() => {
    setTasks(data);
  }, [data]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const oldIndex = tasks.findIndex((t) => t.id === activeId);
    const isOverColumn = STATUSES.includes(overId as Status);
    const newIndex = isOverColumn ? -1 : tasks.findIndex((t) => t.id === overId);

    const activeTaskElem = tasks[oldIndex];
    if (!activeTaskElem) return;

    const newStatus = isOverColumn ? (overId as Status) : tasks[newIndex]?.status;

    if (newStatus && activeTaskElem.status !== newStatus) {
      updateTaskStatus(activeTaskElem.id, newStatus).catch((err) => {
        console.error("Failed to commit drop to Database:", err);
      });

      setTasks((prevTasks) => {
        const nextTasks = [...prevTasks];
        const currentOldIndex = nextTasks.findIndex((t) => t.id === activeId);
        const currentNewIndex = isOverColumn ? -1 : nextTasks.findIndex((t) => t.id === overId);

        nextTasks[currentOldIndex] = { ...nextTasks[currentOldIndex], status: newStatus };

        if (isOverColumn) return nextTasks;
        return arrayMove(nextTasks, currentOldIndex, currentNewIndex);
      });
    } else {
      setTasks((prevTasks) => {
        const currentOldIndex = prevTasks.findIndex((t) => t.id === activeId);
        const currentNewIndex = prevTasks.findIndex((t) => t.id === overId);
        return arrayMove(prevTasks, currentOldIndex, currentNewIndex);
      });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  if (!isMounted) {
    return <div className="w-full h-full min-h-[500px]" />;
  }

  return (
    <>
      <div className="w-full overflow-x-auto px-4 lg:px-6 pb-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full items-start">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasks.filter((t) => t.status === status)}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <KanbanItem task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
