"use client";

import { useState, useEffect } from "react";
import { getDiscountCodesForBusiness } from "@/lib/actions/incentives.actions";
import { useToast } from "@/hooks/use-toast";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, RefreshCw } from "lucide-react";

export default function DiscountCodeManagementTable({ businessId }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [status, setStatus] = useState("all");

  // Fetch discount codes
  const fetchDiscountCodes = async (page = 1, status = "all") => {
    setIsLoading(true);
    try {
      const result = await getDiscountCodesForBusiness({
        businessId,
        page,
        limit: 10,
        status,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setDiscountCodes(result.discountCodes);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch discount codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDiscountCodes(1, status);
  }, [businessId, status]);

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchDiscountCodes(newPage, status);
  };

  // Handle status change
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    fetchDiscountCodes(1, newStatus);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (discountCode) => {
    if (discountCode.isRedeemed) {
      return <Badge variant="secondary">Redeemed</Badge>;
    }
    
    if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
      return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
    }
    
    return <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
  };

  // Format discount value
  const formatDiscountValue = (discountCode) => {
    return discountCode.discountType === "PERCENTAGE"
      ? `${discountCode.discountValue}%`
      : `$${discountCode.discountValue.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Discount Codes</CardTitle>
            <CardDescription>
              View and manage discount codes for your customers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="redeemed">Redeemed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchDiscountCodes(pagination.page, status)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : discountCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No discount codes found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Redeemed</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-medium">
                      {code.code}
                    </TableCell>
                    <TableCell>{formatDiscountValue(code)}</TableCell>
                    <TableCell>{getStatusBadge(code)}</TableCell>
                    <TableCell>
                      {code.responseEntity?.phoneNumber || "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(code.createdAt)}</TableCell>
                    <TableCell>{formatDate(code.redeemedAt)}</TableCell>
                    <TableCell>{formatDate(code.expiresAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {pagination.totalPages > 1 && (
        <CardFooter>
          <Pagination className="w-full justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1 || isLoading}
                />
              </PaginationItem>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === pagination.totalPages || 
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                )
                .map((page, index, array) => {
                  // Add ellipsis if there are gaps
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <PaginationItem key={`ellipsis-${page}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === pagination.page}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                  disabled={pagination.page === pagination.totalPages || isLoading}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  );
}
