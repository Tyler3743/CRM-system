function loadKanbanData() {
      try {
        const res = await fetch('/api/kanban');
        const columns = await res.json();
        const statuses = ['NEW', 'PENDING_CONSULT', 'PENDING_DEPOSIT', 'COMPLETED', 'CANCELLED'];

        statuses.forEach(status => {
          const list = columns[status] || [];
          document.getElementById(`count-${status}
