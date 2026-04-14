"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"
import { useTranslations } from "next-intl"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Columns3Icon, ChevronDownIcon, CircleIcon, MoreHorizontalIcon, ArrowUpDownIcon, FilterIcon } from "lucide-react"
import { TaskDialog } from "@/components/task-dialog"
import { TaskDetailModal, PriorityChip } from "@/components/task-detail-modal"
import { deleteTask } from "@/app/actions/tasks"
import { useRouter } from "next/navigation"

export const schema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  status: z.enum(["Todo", "InProgress", "Review", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  assignee: z.string(),
  assigneeAvatar: z.string().optional().nullable(),
  dueDate: z.string(),
  tags: z.array(z.string()),
})

type Task = z.infer<typeof schema>

function getStatusIcon(status: string) {
  switch (status) {
    case "Done": return <CircleIcon className="size-4 fill-green-500 text-green-500" />
    case "InProgress": return <CircleIcon className="size-4 fill-blue-500 text-blue-500" />
    case "Review": return <CircleIcon className="size-4 fill-yellow-500 text-yellow-500" />
    default: return <CircleIcon className="size-4 text-muted-foreground" />
  }
}

export function DataTable({ data, workspaceId }: { data: Task[]; workspaceId?: string }) {
  const tTasks = useTranslations("Tasks")
  const tFields = useTranslations("TaskFields")
  const router = useRouter()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const ActionCell = ({ task }: { task: Task }) => {
    const [isDeleting, setIsDeleting] = React.useState(false);
    const tCommon = useTranslations("Common");
    const tTasks = useTranslations("Tasks");

    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        await deleteTask(task.id);
        router.refresh();
      } catch (e) {
        console.error(e)
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{tCommon("openMenu")}</span>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <TaskDialog task={task}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              {tTasks("editTask") || "Edit Task"}
            </DropdownMenuItem>
          </TaskDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer">
                {tTasks("deleteTask") || "Delete Task"}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tCommon("areYouSure")}</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. A tarefa <strong>{task.title}</strong> será deletada dos servidores finais de forma permanente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("back")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white">
                  {isDeleting ? tCommon("delete") + "..." : tCommon("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const columns: ColumnDef<Task>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            <span>{tTasks("title")}</span>
            <ArrowUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Button
          variant="link"
          className="px-0 font-medium text-foreground hover:no-underline hover:text-primary"
          onClick={() => {
            setSelectedTask(row.original)
            setDetailOpen(true)
          }}
        >
          <span className="truncate max-w-[250px]">{row.getValue("title")}</span>
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: tTasks("descriptionLabel"),
      cell: ({ row }) => {
        const desc = row.getValue("description") as string | null
        if (!desc) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <span
            className="text-sm text-muted-foreground truncate block max-w-[200px] cursor-pointer hover:text-foreground transition-colors"
            title={desc}
            onClick={() => {
              setSelectedTask(row.original)
              setDetailOpen(true)
            }}
          >
            {desc}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          <span>{tTasks("status")}</span>
          <ArrowUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon(val)}
            <span>{tFields(val)}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          <span>{tTasks("priority")}</span>
          <ArrowUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
      cell: ({ row }) => {
         const p = row.getValue("priority") as string;
         return <PriorityChip priority={p} />;
      }
    },
    {
      accessorKey: "assignee",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          <span>{tTasks("assignee")}</span>
          <ArrowUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
      cell: ({ row }) => {
        const val = row.getValue("assignee") as string;
        const avatar = row.original.assigneeAvatar;
        return (
          <div className="flex items-center gap-2">
             <Avatar className="size-8">
               <AvatarImage src={avatar || undefined} alt={val} />
               <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                 {val ? val.substring(0, 2).toUpperCase() : "?"}
               </AvatarFallback>
             </Avatar>
             <span className="text-sm">{val || tTasks("unassigned")}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 data-[state=open]:bg-accent"
        >
          <span>{tTasks("dueDate")}</span>
          <ArrowUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("dueDate") || "—"}</span>,
    },
    {
      accessorKey: "tags",
      header: tTasks("tags"),
      cell: ({ row }) => {
        const tags = row.getValue("tags") as string[];
        return (
          <div className="flex gap-1 flex-wrap max-w-[150px]">
             {(tags || []).map((tag, i) => (
               <Badge key={i} variant="outline" className="font-normal text-xs py-0 h-5 bg-background shadow-none">
                 {tag}
               </Badge>
             ))}
          </div>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => <ActionCell task={row.original} />
    }
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <>
      <div className="w-full flex-col justify-start gap-4 flex px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 max-w-sm">
              <Input
                placeholder={tTasks("searchPlaceholder")}
                value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("title")?.setFilterValue(event.target.value)
                }
                className="bg-background min-w-[200px]"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              {table.getColumn("status") && (() => {
                const selected = (table.getColumn("status")?.getFilterValue() as string[]) || [];
                const isActive = selected.length > 0;
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`h-9 border-dashed ${isActive ? "border-primary bg-primary/5 text-primary" : ""}`}
                      >
                        <FilterIcon className="mr-2 h-4 w-4 opacity-50" />
                        Status
                        {isActive && (
                          <>
                            <div className="mx-2 h-4 w-[1px] bg-border" />
                            <div className="flex gap-1">
                              {selected.length > 2 ? (
                                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                  {selected.length}
                                </Badge>
                              ) : null}
                              <div className="hidden space-x-1 lg:flex">
                                {selected.length > 2 ? (
                                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                    {selected.length} selecionados
                                  </Badge>
                                ) : (
                                  selected.map((v) => (
                                    <Badge variant="secondary" key={v} className="rounded-sm px-1 font-normal">
                                      {tFields(v)}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px]">
                      {["Todo", "InProgress", "Review", "Done"].map(v => {
                        const isSelected = selected.includes(v);
                        return (
                          <DropdownMenuCheckboxItem 
                            key={v} 
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const next = checked ? [...selected, v] : selected.filter(c => c !== v);
                              table.getColumn("status")?.setFilterValue(next.length ? next : undefined);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(v)}
                              <span>{tFields(v)}</span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              })()}

              {/* Priority Filter */}
              {table.getColumn("priority") && (() => {
                const selected = (table.getColumn("priority")?.getFilterValue() as string[]) || [];
                const isActive = selected.length > 0;
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`h-9 border-dashed ${isActive ? "border-primary bg-primary/5 text-primary" : ""}`}
                      >
                        <FilterIcon className="mr-2 h-4 w-4 opacity-50" />
                        {tTasks("priority")}
                        {isActive && (
                          <>
                            <div className="mx-2 h-4 w-[1px] bg-border" />
                            <div className="flex gap-1">
                              {selected.length > 2 ? (
                                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                  {selected.length} selecionados
                                </Badge>
                              ) : (
                                selected.map((v) => (
                                  <Badge variant="secondary" key={v} className="rounded-sm px-1 font-normal">
                                    {tFields(v)}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px]">
                      {["Low", "Medium", "High"].map(v => {
                        const isSelected = selected.includes(v);
                        return (
                          <DropdownMenuCheckboxItem 
                            key={v} 
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const next = checked ? [...selected, v] : selected.filter(c => c !== v);
                              table.getColumn("priority")?.setFilterValue(next.length ? next : undefined);
                            }}
                          >
                            {tFields(v)}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              })()}

              {/* Assignee Filter */}
              {table.getColumn("assignee") && (() => {
                const selected = (table.getColumn("assignee")?.getFilterValue() as string[]) || [];
                const isActive = selected.length > 0;
                
                // Group by name + avatar to distinguish different users with same name
                const assigneeMap = new Map();
                data.forEach(d => {
                  const key = `${d.assignee}-${d.assigneeAvatar}`;
                  if (!assigneeMap.has(key)) {
                    assigneeMap.set(key, { name: d.assignee, avatar: d.assigneeAvatar });
                  }
                });
                const uniqueAssignees = Array.from(assigneeMap.values());

                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`h-9 border-dashed ${isActive ? "border-primary bg-primary/5 text-primary" : ""}`}
                      >
                        <FilterIcon className="mr-2 h-4 w-4 opacity-50" />
                        {tTasks("assignee")}
                        {isActive && (
                          <>
                            <div className="mx-2 h-4 w-[1px] bg-border" />
                            <div className="flex gap-1 items-center">
                              {selected.length > 1 ? (
                                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                  {selected.length} selecionados
                                </Badge>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="size-6 ring-2 ring-background">
                                        <AvatarImage src={data.find(d => d.assignee === selected[0])?.assigneeAvatar || undefined} />
                                        <AvatarFallback className="text-[10px]">
                                          {selected[0] ? selected[0].substring(0, 2).toUpperCase() : "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{selected[0] || tTasks("unassigned")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px]">
                      {uniqueAssignees.map(u => {
                        const isSelected = selected.includes(u.name);
                        return (
                          <DropdownMenuCheckboxItem 
                            key={`${u.name}-${u.avatar}`} 
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const next = checked ? [...selected, u.name] : selected.filter(c => c !== u.name);
                              table.getColumn("assignee")?.setFilterValue(next.length ? next : undefined);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="size-7">
                                <AvatarImage src={u.avatar || undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                  {u.name ? u.name.substring(0, 2).toUpperCase() : "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{u.name || tTasks("unassigned")}</span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end pl-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3Icon className="mr-2 h-4 w-4" />
                  {tTasks("columns") || "Columns"}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide() && column.id !== "actions")
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id === 'title' ? tTasks("titleLabel") :
                         column.id === 'status' ? tTasks("status") :
                         column.id === 'priority' ? tTasks("priority") :
                         column.id === 'assignee' ? tTasks("assignee") :
                         column.id === 'dueDate' ? tTasks("dueDate") :
                         column.id === 'tags' ? tTasks("tags") :
                         column.id === 'description' ? tTasks("descriptionLabel") : column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {tTasks("noResults") || "No results."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {tTasks("rowsSelected", { 
              selected: table.getFilteredSelectedRowModel().rows.length, 
              total: table.getFilteredRowModel().rows.length 
            }) || `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected.`}
          </div>
        </div>
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
