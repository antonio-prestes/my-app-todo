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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
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
import { Columns3Icon, ChevronDownIcon, ClockIcon, FlagIcon, MoreHorizontalIcon, CircleIcon, UserIcon, HashIcon } from "lucide-react"
import { TaskDialog } from "@/components/task-dialog"
import { deleteTask } from "@/app/actions/tasks"
import { useRouter } from "next/navigation"

export const schema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["Todo", "InProgress", "Review", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  assignee: z.string(),
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

  const ActionCell = ({ task }: { task: Task }) => {
    const [isDeleting, setIsDeleting] = React.useState(false);

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
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {/* Edit Dialog Trigger integrated locally */}
          <TaskDialog task={task}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              Editar Tarefa
            </DropdownMenuItem>
          </TaskDialog>
          {/* Delete Dialog embedded accurately */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer">
                Excluir Tarefa
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem absoluta certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. A tarefa <strong>{task.title}</strong> será deletada dos servidores finais de forma permanente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white">
                  {isDeleting ? "Deletando..." : "Sim, excluir"}
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
      header: tTasks("title"),
      cell: ({ row }) => (
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="link" className="px-0 font-medium text-foreground hover:no-underline hover:text-primary">
              <span className="truncate max-w-[250px]">{row.getValue("title")}</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-full sm:max-w-md h-full rounded-none right-0 left-auto mt-0">
            <div className="mx-auto w-full max-w-sm flex flex-col h-full h-[100vh]">
              <DrawerHeader className="p-6">
                <DrawerTitle className="text-2xl font-bold">{row.getValue("title")}</DrawerTitle>
                <DrawerDescription>{row.original.id}</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-6">
                  {/* Status Item */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground flex items-center gap-2">
                       <CircleIcon className="size-4" /> {tTasks("status")}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {getStatusIcon(row.original.status)}
                      {tFields(row.original.status)}
                    </div>
                  </div>
                  {/* Assignee Item */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground flex items-center gap-2">
                       <UserIcon className="size-4" /> {tTasks("assignee")}
                    </div>
                    <div className="text-sm font-medium">
                      {row.original.assignee}
                    </div>
                  </div>
                  {/* Due Date Item */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground flex items-center gap-2">
                       <ClockIcon className="size-4" /> {tTasks("dueDate")}
                    </div>
                    <div className="text-sm font-medium">
                      {row.original.dueDate}
                    </div>
                  </div>
                  {/* Priority Item */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground flex items-center gap-2">
                       <FlagIcon className="size-4" /> {tTasks("priority")}
                    </div>
                    <div className="text-sm font-medium">
                      {tFields(row.original.priority)}
                    </div>
                  </div>
                  {/* Tags Item */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground flex items-center gap-2">
                       <HashIcon className="size-4" /> {tTasks("tags")}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {(row.original.tags || []).map((tag, idx) => (
                         <Badge key={idx} variant="secondary" className="font-normal">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ),
    },
    {
      accessorKey: "status",
      header: tTasks("status"),
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
      header: tTasks("priority"),
      cell: ({ row }) => {
         const p = row.getValue("priority") as string;
         return <span className="text-sm">{tFields(p)}</span>;
      }
    },
    {
      accessorKey: "assignee",
      header: tTasks("assignee"),
      cell: ({ row }) => {
        const val = row.getValue("assignee") as string;
        return (
          <div className="flex items-center gap-2">
             <div className="size-6 bg-muted rounded-full flex items-center justify-center text-xs border uppercase">
                {val ? val.substring(0, 1) : "?"}
             </div>
             <span className="text-sm">{val || "Unassigned"}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "dueDate",
      header: tTasks("dueDate"),
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("dueDate")}</span>,
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
    <div className="w-full flex-col justify-start gap-4 flex px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <Input
          placeholder={tTasks("searchPlaceholder")}
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm bg-background"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon className="mr-2 h-4 w-4" />
                Columns
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
                      {column.id === 'title' ? tTasks("title") :
                       column.id === 'status' ? tTasks("status") :
                       column.id === 'priority' ? tTasks("priority") :
                       column.id === 'assignee' ? tTasks("assignee") :
                       column.id === 'dueDate' ? tTasks("dueDate") :
                       column.id === 'tags' ? tTasks("tags") : column.id}
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      </div>
    </div>
  )
}
