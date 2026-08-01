import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ArrowUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { CategoryBadge } from "@/components/category-badge";
import { type Subscription } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

interface SubscriptionTableProps {
  subscriptions: Subscription[];
}

export function SubscriptionTable({ subscriptions }: SubscriptionTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subscription</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Cost
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Renewal
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell">Payment</TableHead>
            <TableHead className="hidden lg:table-cell">AI confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No subscriptions found.
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => (
              <TableRow key={sub.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    to="/subscriptions/$id"
                    params={{ id: sub.id }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
                      {sub.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.billingCycle}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <CategoryBadge category={sub.category} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={sub.status} />
                </TableCell>
                <TableCell>
                  <p className="font-medium">
                    ${sub.cost}
                    <span className="text-xs font-normal text-muted-foreground">/{sub.billingCycle === "annual" ? "yr" : "mo"}</span>
                  </p>
                </TableCell>
                <TableCell>
                  <p className={cn("text-sm", isPastDate(sub.nextRenewal) ? "text-destructive font-medium" : "text-muted-foreground")}>
                    {format(parseISO(sub.nextRenewal), "MMM d, yyyy")}
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {sub.paymentMethod}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm font-medium">{sub.confidence}%</span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function isPastDate(date: string) {
  return new Date(date) < new Date("2026-08-01") && new Date(date).getDate() !== new Date("2026-08-01").getDate();
}
