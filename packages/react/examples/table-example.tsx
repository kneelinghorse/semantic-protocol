import React, { useState, useMemo } from 'react';
import {
  SemanticProvider,
  useSemantics,
  useDiscovery,
  useRelationships,
  SemanticBoundary,
  SemanticPortal,
} from '@semantic-protocol/react';

interface TableData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const TableHeader: React.FC<{
  column: string;
  sortable?: boolean;
  onSort?: (column: string) => void;
}> = ({ column, sortable = true, onSort }) => {
  const { semanticProps } = useSemantics({
    manifest: {
      name: `TableHeader-${column}`,
      version: '1.0.0',
      purpose: `Display and control ${column} column`,
      capabilities: sortable ? ['display', 'sortable'] : ['display'],
      metadata: {
        type: 'table-header',
        column,
        sortable,
        tags: ['table', 'header', column.toLowerCase()],
      },
    },
  });

  return (
    <th 
      {...semanticProps}
      onClick={() => sortable && onSort?.(column)}
      style={{ cursor: sortable ? 'pointer' : 'default' }}
    >
      {column}
      {sortable && ' ↕'}
    </th>
  );
};

const TableRow: React.FC<{
  data: TableData;
  onSelect: (id: number) => void;
  selected: boolean;
}> = ({ data, onSelect, selected }) => {
  const { semanticProps, updateManifest } = useSemantics({
    manifest: {
      name: `TableRow-${data.id}`,
      version: '1.0.0',
      purpose: `Display data for ${data.name}`,
      capabilities: ['display', 'selectable'],
      metadata: {
        type: 'table-row',
        rowId: data.id,
        status: data.status,
        selected,
        tags: ['table', 'row', data.status],
      },
    },
  });

  React.useEffect(() => {
    updateManifest({
      metadata: {
        selected,
      },
    });
  }, [selected, updateManifest]);

  return (
    <tr 
      {...semanticProps}
      onClick={() => onSelect(data.id)}
      style={{ 
        backgroundColor: selected ? '#e3f2fd' : 'transparent',
        cursor: 'pointer',
      }}
    >
      <td>{data.id}</td>
      <td>{data.name}</td>
      <td>{data.email}</td>
      <td>{data.role}</td>
      <td>
        <span className={`status ${data.status}`}>
          {data.status}
        </span>
      </td>
    </tr>
  );
};

const TableActions: React.FC<{
  selectedCount: number;
  onBulkAction: (action: string) => void;
}> = ({ selectedCount, onBulkAction }) => {
  const { semanticProps } = useSemantics({
    manifest: {
      name: 'TableActions',
      version: '1.0.0',
      purpose: 'Provide bulk actions for selected rows',
      capabilities: ['bulk-actions', 'filtering'],
      metadata: {
        type: 'table-actions',
        selectedCount,
        tags: ['table', 'actions', 'toolbar'],
      },
    },
  });

  const { results: selectedRows } = useDiscovery({
    query: {
      metadata: { selected: true },
    },
    realTime: true,
  });

  return (
    <div {...semanticProps} className="table-actions">
      <span>{selectedCount} rows selected</span>
      <button 
        onClick={() => onBulkAction('export')}
        disabled={selectedCount === 0}
      >
        Export Selected
      </button>
      <button 
        onClick={() => onBulkAction('delete')}
        disabled={selectedCount === 0}
      >
        Delete Selected
      </button>
      <button 
        onClick={() => onBulkAction('activate')}
        disabled={selectedCount === 0}
      >
        Activate Selected
      </button>
    </div>
  );
};

const SemanticTable: React.FC<{ data: TableData[] }> = ({ data }) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { semanticProps, componentId } = useSemantics({
    manifest: {
      name: 'UserDataTable',
      version: '1.0.0',
      purpose: 'Display and manage user data in tabular format',
      capabilities: ['display', 'sorting', 'filtering', 'selection', 'pagination'],
      metadata: {
        type: 'table',
        rowCount: data.length,
        selectedCount: selectedRows.size,
        tags: ['table', 'data-grid', 'users'],
      },
    },
  });

  const { results: tableHeaders } = useDiscovery({
    query: {
      metadata: { type: 'table-header' },
    },
  });

  const { results: tableRows } = useDiscovery({
    query: {
      metadata: { type: 'table-row' },
    },
    realTime: true,
  });

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn.toLowerCase() as keyof TableData];
      const bVal = b[sortColumn.toLowerCase() as keyof TableData];
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [data, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRowSelect = (id: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on ${selectedRows.size} rows`);
    const affectedData = data.filter(row => selectedRows.has(row.id));
    console.log('Affected data:', affectedData);
  };

  return (
    <div {...semanticProps} className="semantic-table-container">
      <TableActions 
        selectedCount={selectedRows.size}
        onBulkAction={handleBulkAction}
      />
      
      <table className="semantic-table">
        <thead>
          <tr>
            <TableHeader column="ID" sortable onSort={handleSort} />
            <TableHeader column="Name" sortable onSort={handleSort} />
            <TableHeader column="Email" sortable onSort={handleSort} />
            <TableHeader column="Role" sortable onSort={handleSort} />
            <TableHeader column="Status" sortable onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sortedData.map(row => (
            <TableRow
              key={row.id}
              data={row}
              onSelect={handleRowSelect}
              selected={selectedRows.has(row.id)}
            />
          ))}
        </tbody>
      </table>
      
      <div className="table-info">
        <p>Headers discovered: {tableHeaders.length}</p>
        <p>Rows discovered: {tableRows.length}</p>
        <p>Selected rows: {selectedRows.size}</p>
      </div>
    </div>
  );
};

const TableWithPortal: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TableData | null>(null);

  const sampleData: TableData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Manager', status: 'active' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'active' },
  ];

  return (
    <div>
      <SemanticTable data={sampleData} />
      
      <div id="details-portal-target" style={{ marginTop: '20px' }}>
        {/* Portal target for details view */}
      </div>
      
      {showDetails && selectedUser && (
        <SemanticPortal targetId="details-portal-target">
          <div className="user-details">
            <h3>User Details</h3>
            <p>Name: {selectedUser.name}</p>
            <p>Email: {selectedUser.email}</p>
            <p>Role: {selectedUser.role}</p>
            <p>Status: {selectedUser.status}</p>
            <button onClick={() => setShowDetails(false)}>Close</button>
          </div>
        </SemanticPortal>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SemanticProvider enableDevTools>
      <SemanticBoundary>
        <div className="app">
          <h1>Semantic Protocol Table Example</h1>
          <TableWithPortal />
        </div>
      </SemanticBoundary>
    </SemanticProvider>
  );
};

export default App;