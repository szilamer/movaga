'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  totalSales: number;
  networkSales: number;
  children: User[];
  orders: Order[];
}

interface UserNodeProps {
  user: User;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}

interface OrderItem {
  quantity: number;
  product?: {
    name?: string;
    pointValue?: number;
  };
}

interface Order {
  id: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const UserNode = ({ user, level, expanded, onToggle }: UserNodeProps) => {
  const hasChildren = user.children.length > 0;
  const isExpanded = expanded.has(user.id);
  
  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <Card className="mb-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <button
                onClick={() => onToggle(user.id)}
                className="rounded p-1 hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            )}
            <div>
              <div className="font-medium">{user.name || 'Névtelen felhasználó'}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(user.totalSales)}</div>
            <div className="text-sm text-gray-500">
              Hálózati forgalom: {formatCurrency(user.networkSales)}
            </div>
          </div>
        </div>
      </Card>
      {isExpanded && user.children.map(child => (
        <UserNode
          key={child.id}
          user={child}
          level={level + 1}
          expanded={expanded}
          onToggle={onToggle}
        />
      ))}
      {user.orders && user.orders.length > 0 && (
        <div className="mt-2">
          <div className="font-semibold text-sm text-gray-700">Vásárlások:</div>
          <ul className="ml-4 list-disc text-xs text-gray-600">
            {user.orders.map(order => (
              <li key={order.id} className="mb-1">
                <div>
                  <span className="font-medium">{new Date(order.createdAt).toLocaleDateString('hu-HU')}</span> – Összeg: {order.total.toLocaleString()} Ft
                </div>
                {order.items && order.items.length > 0 && (
                  <ul className="ml-4 list-square">
                    {order.items.map((item: OrderItem, idx: number) => (
                      <li key={idx}>
                        {item.product?.name} – {item.quantity} db – <span className="text-blue-700 font-semibold">{item.product?.pointValue ?? 0} pont/db</span> (össz: {item.quantity * (item.product?.pointValue ?? 0)} pont)
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [expanded, setExpanded] = useState(new Set<string>());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    { value: 1, label: 'Január' },
    { value: 2, label: 'Február' },
    { value: 3, label: 'Március' },
    { value: 4, label: 'Április' },
    { value: 5, label: 'Május' },
    { value: 6, label: 'Június' },
    { value: 7, label: 'Július' },
    { value: 8, label: 'Augusztus' },
    { value: 9, label: 'Szeptember' },
    { value: 10, label: 'Október' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!response.ok) throw new Error('Hiba történt a felhasználók betöltése során');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedMonth, selectedYear]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <div className="w-48">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Válassz hónapot" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Válassz évet" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {users.map(user => (
          <UserNode
            key={user.id}
            user={user}
            level={0}
            expanded={expanded}
            onToggle={toggleExpand}
          />
        ))}
      </div>
    </div>
  );
} 