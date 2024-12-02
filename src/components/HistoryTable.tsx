import { useState, useEffect } from "react";
import {
  TextField,
  Table,
  TablePagination,
  TableSortLabel,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  styled,
} from "@mui/material";
import { claude } from "../styles/Theme";
// @ts-ignore
import timeago from "epoch-timeago";

const columns = ["Site", /*"Tags",*/ "Visit Count", "Last Visited"];
type TableSortableColumns = "title" | "tag" | "visitCount" | "lastVisitTime";
function propertyToSortBy(property: string): TableSortableColumns {
  if (property === "Site") {
    return "title";
  } else if (property === "Tags") {
    return "tag";
  } else if (property === "Visit Count") {
    return "visitCount";
  } else {
    return "lastVisitTime";
  }
}
interface TableItem {
  id: string;
  title?: string;
  typedCount?: number;
  url?: string;
  visitCount?: number;
  tag?: string;
  lastVisitTime?: number;
  humanReadableTime?: string;
}
type SortDirection = "desc" | "asc";

const domainGetterRegex = /(?:[\w-]+\.)+[\w-]+/;
function getDomainFromURL(url: string | undefined) {
  if (url === undefined) {
    return "";
  }
  const domainCapture = url.match(domainGetterRegex);
  if (domainCapture) {
    return domainCapture[0];
  }
  return "";
}
function descendingComparator(
  a: TableItem,
  b: TableItem,
  orderBy: TableSortableColumns
) {
  if (b[orderBy] === undefined) {
    return -1;
  }
  if (a[orderBy] === undefined) {
    return -1;
  }
  if (b[orderBy]! < a[orderBy]!) {
    return -1;
  }
  if (b[orderBy]! > a[orderBy]!) {
    return 1;
  }
  return 0;
}
function getComparator(order: SortDirection, orderBy: TableSortableColumns) {
  return order === "desc"
    ? (a: TableItem, b: TableItem) => descendingComparator(a, b, orderBy)
    : (a: TableItem, b: TableItem) => -descendingComparator(a, b, orderBy);
}

const CustomTextField = styled(TextField)({
  "& label.Mui-focused": {
    color: "black",
  },
  "& input:valid:focus + fieldset": {
    borderColor: "black",
  },
});

export default function HistoryTable() {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState("desc" as SortDirection);
  const [orderBy, setOrderBy] = useState("visitCount" as TableSortableColumns);
  const [init, setInit] = useState(false);
  const [history, setHistory] = useState([] as TableItem[]);
  const [historyItems, setHistoryItems] = useState<
    chrome.history.HistoryItem[]
  >([]);

  useEffect(() => {
    chrome.history.search({ text: "", maxResults: 1000000000 }, (data) => {
      setHistoryItems(data);
    });
  }, []);

  // Convert data to an HTML table
  const convertToHTMLTable = (data: chrome.history.HistoryItem[]) => {
    let table = `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>History Table for</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                background-color: #f4f4f9;
            }
            h1 {
                text-align: center;
                color: #333;
            }
            .search-container {
                text-align: center;
                margin-bottom: 20px;
            }
            .search-input {
                padding: 8px;
                font-size: 14px;
                width: 50%;
                max-width: 400px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin: 10px auto;
                display: block;
            }
            .table-container {
                width: 100%;
                overflow-x: auto;
                margin: 0 auto;
                max-width: 90%;
            }
            table {
                width: 80%;
                border-collapse: collapse;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                background-color: white;
                margin: 0 auto;
            }
            th, td {
                padding: 8px 10px;
                font-size: 14px; /* Reduced font size */
                text-align: left;
                max-width: 150px;
                overflow: hidden;
                text-overflow: ellipsis;
                border: 1px solid #ddd;
            }
            th {
                background-color: #007BFF;
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            td a {
                color: #007BFF;
                text-decoration: none;
            }
            td a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <h1>History Table</h1>
        <div class="search-container">
            <input type="text" id="myInput" onkeyup="searchFunction()" placeholder="Search.." class="search-input">
        </div>
        <div class="table-container">
            <table border="1" cellspacing="0" cellpadding="5" id="historyTable">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>URL</th>
                        <th>Visit Count</th>
                        <th>Last Visit Time</th>
                    </tr>
                </thead>
                <tbody>`;

    // Add rows to the table
    data.forEach((item) => {
      const visitTime = item.lastVisitTime
        ? new Date(item.lastVisitTime).toLocaleString()
        : "N/A"; // Convert timestamp to readable date
      table += `
            <tr>
              <td>${item.title}</td>
              <td><a href="${item.url}" target="_blank">${item.url}</a></td>
              <td>${item.visitCount}</td>
              <td>${visitTime}</td>
            </tr>`;
    });

    table += `</tbody></table></div>

        <script>
            function searchFunction() {
            // Declare variables
            var input, filter, table, tr, td, i, txtValue;
            input = document.getElementById("myInput");
            filter = input.value.toUpperCase();
            table = document.getElementById("historyTable");
            tr = table.getElementsByTagName("tr");

            // Loop through all table rows, and hide those who don't match the search query
            for (i = 0; i < tr.length; i++) {
                td = tr[i].getElementsByTagName("td")[0];
                if (td) {
                txtValue = td.textContent || td.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                } else {
                    tr[i].style.display = "none";
                }
                }
            }
            }
        </script>
    </body>
    </html>`;
    return table;
  };

  // Trigger file download with CSV data
  const downloadHTML = () => {
    const Data = convertToHTMLTable(historyItems);
    const blob = new Blob([Data], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const now = new Date();
    const formattedDate = now
      .toISOString()
      .replace(/[-T:.]/g, "")
      .slice(0, 15);

    // Ensure the blob is properly handled in all browsers
    if ((window.navigator as any).msSaveBlob) {
      (window.navigator as any).msSaveBlob(blob, `${formattedDate}.html`); // For IE
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = `${formattedDate}.html`; // Filename for the downloaded file
      link.click(); // Trigger download
    }
  };

  const handleRequestSort = (property: TableSortableColumns) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const searchHistory = (searchText: string) => {
    chrome.history.search(
      { text: searchText, maxResults: 1000000000 },
      function (data) {
        const fetchedHistory = data.map((entry: chrome.history.HistoryItem) => {
          const taggedEntry: TableItem = entry;
          // taggedEntry.tag = "woah"
          taggedEntry.humanReadableTime = timeago(taggedEntry.lastVisitTime);
          return taggedEntry;
        });
        setPage(0);
        setInit(true);
        setHistory(fetchedHistory);
      }
    );
  };
  if (!init) {
    searchHistory("");
  }
  return (
    <div style={{ maxHeight: 550 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center", paddingTop: 3, paddingBottom: 3 }}>
          <button
            style={{
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              fontWeight: 600,
              color: "white",
              borderRadius: "0.25rem",
              backgroundColor: "#4F46E5",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              cursor: "pointer",
            }}
            onClick={downloadHTML}
          >
            Download history as HTML table
          </button>
        </div>
        <CustomTextField
          style={{ width: "100%" }}
          id="outlined-basic"
          label="Search History"
          defaultValue={""}
          onChange={(event) => searchHistory(event.target.value)}
        />
      </div>
      <TableContainer>
        <Table stickyHeader={true}>
          <TableHead>
            <TableRow>
              {columns.map((column) => {
                const propertyAsOrderBy = propertyToSortBy(column);
                return (
                  <TableCell
                    style={tableHeaderStyle}
                    sortDirection={
                      (propertyAsOrderBy === column
                        ? order
                        : false) as SortDirection
                    }
                    onMouseDown={() => handleRequestSort(propertyAsOrderBy)}
                  >
                    {column}
                    <TableSortLabel
                      active={propertyAsOrderBy === orderBy}
                      direction={
                        (propertyAsOrderBy === orderBy
                          ? order
                          : "asc") as SortDirection
                      }
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {history
              .slice()
              .sort(getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((historyRow) => {
                return (
                  <TableRow
                    style={tableRowStyle}
                    onMouseDown={() => {
                      window.open(historyRow.url, "_blank");
                    }}
                  >
                    <TableCell>
                      <div>{historyRow.title}</div>
                      <div
                        style={{
                          textDecoration: "underline",
                          color: "#737373",
                        }}
                      >
                        {getDomainFromURL(historyRow.url)}
                      </div>
                    </TableCell>
                    {/* <TableCell>{historyRow.tag}</TableCell> */}
                    <TableCell>{historyRow.visitCount}</TableCell>
                    <TableCell>{historyRow.humanReadableTime}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={history.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_event, newPage: number) => {
          setPage(newPage);
        }}
        onRowsPerPageChange={(event: any) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </div>
  );
}

const tableRowStyle = { cursor: "pointer" };
const tableHeaderStyle = {
  backgroundColor: "black",
  color: claude,
  border: `1px solid ${claude}`,
  cursor: "pointer",
};
