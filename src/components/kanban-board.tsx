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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleIcon, ClockIcon, UserIcon, FlagIcon } from "lucide-react";
import { updateTaskStatus } from "@/app/actions/tasks";

// Types
import { schema } from "./data-table";
import { z } from "zod";

type Task = z.infer<typeof schema>;
type Status = Task["status"];

const STATUSES: Status[] = ["Todo", "InProgress", "Review", "Done"];

// Kanban Item Component
function KanbanItem({
  task,
  isDragging,
}: {
  task: Task;
  isDragging?: boolean;
}) {
  const tFields = useTranslations("TaskFields");

  return (
    <Card
      className={`mb-3 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <p className="font-medium text-sm leading-tight">{task.title}</p>
        <div className="flex items-center justify-between mt-1">
          <Badge variant="outline" className="text-xs font-normal">
            {task.id}
          </Badge>
          <div className="flex gap-2">
            {task.priority === "High" && (
              <FlagIcon className="size-4 text-red-500" />
            )}
            {task.priority === "Medium" && (
              <FlagIcon className="size-4 text-yellow-500" />
            )}
            {task.priority === "Low" && (
              <FlagIcon className="size-4 text-blue-500" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <UserIcon className="size-3" />
            <span className="truncate max-w-[80px]">{task.assignee}</span>
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="size-3" />
            <span>{task.dueDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable wrapper
function SortableTask({ task }: { task: Task }) {
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
      <KanbanItem task={task} isDragging={isDragging} />
    </div>
  );
}

// Column Component
function KanbanColumn({ status, tasks }: { status: Status; tasks: Task[] }) {
  const tFields = useTranslations("TaskFields");

  return (
    <div className="flex w-72 flex-col rounded-lg bg-muted/50 p-4">
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
        <div className="flex flex-1 flex-col min-h-[150px]">
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ data }: { data: Task[] }) {
  const [tasks, setTasks] = React.useState<Task[]>(data);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

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

    setTasks((tasks) => {
      const oldIndex = tasks.findIndex((t) => t.id === activeId);
      const newIndex = tasks.findIndex((t) => t.id === overId);

      const activeTask = tasks[oldIndex];
      const overTask = tasks[newIndex];

      // If dropping over a different status column (or item in it)
      if (activeTask && overTask && activeTask.status !== overTask.status) {
        activeTask.status = overTask.status;
        
        // Execute background asynchronous Next.js Server Action
        updateTaskStatus(activeTask.id, overTask.status).catch((err) => {
          console.error("Failed to commit drop to Database:", err);
        });
      }

      return arrayMove(tasks, oldIndex, newIndex);
    });
  };

  return (
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
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanItem task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
