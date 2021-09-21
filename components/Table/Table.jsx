/* eslint-disable react/jsx-key */
import React, { useState, useEffect } from 'react'
import {
  useTable,
  useBlockLayout,
  useResizeColumns,
  useSortBy,
  useFlexLayout,
} from 'react-table'
import { format } from 'date-fns'
import Link from 'next/link'
import { createUseStyles } from 'react-jss'
import { theming, useMantineTheme, NativeSelect, Group } from '@mantine/core'
import {
  statusEnum,
  getStatusBadgeFromStatus,
  getStatusLabelsFromStatus,
} from '../../utils/statusHelper'
import InsertForm from '../InsertForm/InsertForm'
import { supabase } from '../../utils/supabaseClient'

const useStyles = createUseStyles(
  (theme) => ({
    table: {
      width: '100%',
      display: 'inline-block',
      borderSpacing: '0',
      backgroundColor: theme.colors.dark[5],
      border: `1px solid ${theme.colors.dark[3]}`,
      borderBottomLeftRadius: '8px',
      borderTopRightRadius: '8px',
      overflow: 'auto',
      fontSize: theme.fontSizes.sm
    },
    headRow: {
      textTransform: 'uppercase',
      fontSize: theme.fontSizes.xs,
      fontWeight: 700,
      color: theme.colors.gray[3],
    },
    tr: {
      '&:last-child': {
        '& > div': {
          borderBottom: 0,
        },
      },
    },
    th: {
      margin: '0',
      padding: '.5rem .5rem .5rem 1rem',
      borderBottom: `1px solid ${theme.colors.dark[3]}`,
      borderRight: `1px solid ${theme.colors.dark[3]}`,
      position: 'relative',
      '&:last-child': {
        borderRight: 0,
      },
    },
    td: {
      margin: '0',
      padding: '.5rem .5rem .5rem 1rem',
      borderBottom: `1px solid ${theme.colors.dark[3]}`,
      borderRight: `1px solid ${theme.colors.dark[3]}`,
      position: 'relative',
      '&:last-child': {
        borderRight: 0,
      },
    },
    resizer: {
      display: 'inline-block',
      background: 'transparent',
      width: '3px',
      height: '100%',
      position: 'absolute',
      right: '2px',
      top: '0',
      transform: 'translateX(50%)',
      zIndex: '1',
      touchAction: 'none',
    },
    link: {
      color: theme.colors.cyan[6],
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  }),
  { theming }
)

export default function Table() {
  const classes = useStyles()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const theme = useMantineTheme()

  async function updateStatus(event, id) {
    try {
      setLoading(true)
      const user = supabase.auth.user()

      const updates = {
        id,
        status: event.target.value,
        updated_at: new Date(),
        user_id: user.id
      }

      let { data, error } = await supabase.from('applications').upsert(updates)

      if (error) {
        throw error
      }

      if (data) {

      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getApplications() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('applications').select(
        `
          id,
          status,
          title,
          link,
          date,
          contact
         `
      )

      if (data) {
        setData(data)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getApplications()
    const subscription = supabase
      .from(`applications:user_id=eq.${supabase.auth.user().id}`)
      .on('INSERT', getApplications)
      .on('UPDATE', getApplications)
      .on('DELETE', getApplications)
      .subscribe()
    return () => {
      supabase.removeSubscription(subscription)
    }
  }, [])

  const columns = React.useMemo(
    () => [
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Title',
        accessor: 'title',
        width: 200,
      },
      {
        Header: 'Date',
        accessor: 'date',
        width: 100,
      },
      {
        Header: 'Link',
        accessor: 'link',
        width: 70,
      },
      {
        Header: 'Contact',
        accessor: 'contact',
      },
    ],
    []
  )

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 80,
      maxWidth: 400,
    }),
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    resetResizing,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
    },
    useFlexLayout,
    useResizeColumns,
    useSortBy
  )

  return (
    <div>
      <div>
        <InsertForm />
      </div>
      <div {...getTableProps()} className={classes.table}>
        <div>
          {headerGroups.map((headerGroup) => (
            <div
              {...headerGroup.getHeaderGroupProps()}
              className={classes.headRow}
            >
              {headerGroup.headers.map((column) => (
                <div
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className={classes.th}
                >
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                  <div
                    {...column.getResizerProps()}
                    className={`${classes.resizer} ${
                      column.isResizing ? 'isResizing' : ''
                    }`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row)
            return (
              <div {...row.getRowProps()} className={classes.tr}>
                {row.cells.map((cell) => {
                  if (cell.column.id === 'status') {
                    return (
                      <div {...cell.getCellProps()} className={classes.td}>
                        <Group>
                          {getStatusBadgeFromStatus(cell.value)}
                          <NativeSelect
                            onChange={(event) =>
                              updateStatus(event, row.original.id)
                            }
                            value={cell.value}
                            style={{
                              marginLeft: '20px',
                              borderBottom: `1px solid ${theme.colors.dark[3]}`,
                            }}
                            data={Object.entries(statusEnum).map((status) => {
                              return {
                                value: status[1],
                                label: getStatusLabelsFromStatus(status[1]),
                              }
                            })}
                          />
                        </Group>
                      </div>
                    )
                  }
                  if (cell.column.id === 'link') {
                    return (
                      <div {...cell.getCellProps()} className={classes.td}>
                        <div>
                          {cell.value && (
                            <a
                              className={classes.link}
                              href={cell.value}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Link
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  }
                  if (cell.column.id === 'contact') {
                    return (
                      <div {...cell.getCellProps()} className={classes.td}>
                        <span style={{ whiteSpace: 'pre-wrap' }}>
                          {cell.value}
                        </span>
                      </div>
                    )
                  }
                  if (cell.column.id === 'date') {
                    return (
                      <div {...cell.getCellProps()} className={classes.td}>
                        {cell.value && (
                          <>{format(new Date(cell.value), 'E, MMM d')}</>
                        )}
                      </div>
                    )
                  }
                  return (
                    <div {...cell.getCellProps()} className={classes.td}>
                      {cell.render('Cell')}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
