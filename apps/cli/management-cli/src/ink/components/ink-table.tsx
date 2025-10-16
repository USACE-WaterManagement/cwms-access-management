import React from 'react';
import { Box, Text } from 'ink';

type Scalar = string | number | boolean | null | undefined;

type ScalarDict = {
  [key: string]: Scalar;
};

export type CellProps = React.PropsWithChildren<{ column: number }>;

export type TableProps<T extends ScalarDict> = {
  data: T[];
  columns?: (keyof T)[];
  padding?: number;
  header?: (props: React.PropsWithChildren<{}>) => JSX.Element;
  cell?: (props: CellProps) => JSX.Element;
  skeleton?: (props: React.PropsWithChildren<{}>) => JSX.Element;
};

type RowConfig = {
  cell: (props: CellProps) => JSX.Element;
  padding: number;
  skeleton: {
    component: (props: React.PropsWithChildren<{}>) => JSX.Element;
    left: string;
    right: string;
    cross: string;
    line: string;
  };
};

type RowProps<T extends ScalarDict> = {
  key: string;
  data: Partial<T>;
  columns: Column<T>[];
};

type Column<T> = {
  key: string;
  column: keyof T;
  width: number;
};

function Header(props: React.PropsWithChildren<{}>) {
  return (
    <Text bold>
      {props.children}
    </Text>
  );
}

function Cell(props: CellProps) {
  return <Text>{props.children}</Text>;
}

function Skeleton(props: React.PropsWithChildren<{}>) {
  return <Text bold>{props.children}</Text>;
}

function intersperse<T, I>(intersperser: (index: number) => I, elements: T[]): (T | I)[] {
  const interspersed: (T | I)[] = elements.reduce((acc, element, index) => {
    if (acc.length === 0) return [element];
    return [...acc, intersperser(index), element];
  }, [] as (T | I)[]);

  return interspersed;
}

function row<T extends ScalarDict>(config: RowConfig): (props: RowProps<T>) => JSX.Element {
  const skeleton = config.skeleton;

  return (props) => (
    <Box flexDirection="row">
      <skeleton.component>{skeleton.left}</skeleton.component>
      {...intersperse(
        (i) => {
          const key = `${props.key}-hseparator-${i}`;
          return <skeleton.component key={key}>{skeleton.cross}</skeleton.component>;
        },
        props.columns.map((column, colI) => {
          const value = props.data[column.column];

          if (value == undefined || value == null) {
            const key = `${props.key}-empty-${column.key}`;
            return (
              <config.cell key={key} column={colI}>
                {skeleton.line.repeat(column.width)}
              </config.cell>
            );
          } else {
            const key = `${props.key}-cell-${column.key}`;
            const ml = config.padding;
            const mr = column.width - String(value).length - config.padding;

            return (
              <config.cell key={key} column={colI}>
                {`${skeleton.line.repeat(ml)}${String(value)}${skeleton.line.repeat(mr)}`}
              </config.cell>
            );
          }
        })
      )}
      <skeleton.component>{skeleton.right}</skeleton.component>
    </Box>
  );
}

export function Table<T extends ScalarDict>(props: TableProps<T>) {
  const padding = props.padding || 1;
  const headerComponent = props.header || Header;
  const cellComponent = props.cell || Cell;
  const skeletonComponent = props.skeleton || Skeleton;

  const getDataKeys = (): (keyof T)[] => {
    const keys = new Set<keyof T>();
    for (const data of props.data) {
      for (const key in data) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  };

  const columns = props.columns || getDataKeys();

  const getColumns = (): Column<T>[] => {
    const widths: Column<T>[] = columns.map((key) => {
      const header = String(key).length;
      const data = props.data.map((data) => {
        const value = data[key];
        if (value == undefined || value == null) return 0;
        return String(value).length;
      });

      const width = Math.max(...data, header) + padding * 2;

      return {
        column: key,
        width: width,
        key: String(key),
      };
    });

    return widths;
  };

  const getHeadings = (): Partial<T> => {
    const headings: Partial<T> = columns.reduce(
      (acc, column) => ({ ...acc, [column]: column }),
      {}
    );
    return headings;
  };

  const columnData = getColumns();
  const headings = getHeadings();

  const headerRow = row<T>({
    cell: skeletonComponent,
    padding: padding,
    skeleton: {
      component: skeletonComponent,
      line: '─',
      left: '┌',
      right: '┐',
      cross: '┬',
    },
  });

  const headingRow = row<T>({
    cell: headerComponent,
    padding: padding,
    skeleton: {
      component: skeletonComponent,
      line: ' ',
      left: '│',
      right: '│',
      cross: '│',
    },
  });

  const separatorRow = row<T>({
    cell: skeletonComponent,
    padding: padding,
    skeleton: {
      component: skeletonComponent,
      line: '─',
      left: '├',
      right: '┤',
      cross: '┼',
    },
  });

  const dataRow = row<T>({
    cell: cellComponent,
    padding: padding,
    skeleton: {
      component: skeletonComponent,
      line: ' ',
      left: '│',
      right: '│',
      cross: '│',
    },
  });

  const footerRow = row<T>({
    cell: skeletonComponent,
    padding: padding,
    skeleton: {
      component: skeletonComponent,
      line: '─',
      left: '└',
      right: '┘',
      cross: '┴',
    },
  });

  return (
    <Box flexDirection="column">
      {headerRow({ key: 'header', columns: columnData, data: {} })}
      {headingRow({ key: 'heading', columns: columnData, data: headings })}
      {props.data.map((row, index) => {
        const key = `row-${index}`;
        return (
          <Box flexDirection="column" key={key}>
            {separatorRow({ key: `separator-${key}`, columns: columnData, data: {} })}
            {dataRow({ key: `data-${key}`, columns: columnData, data: row })}
          </Box>
        );
      })}
      {footerRow({ key: 'footer', columns: columnData, data: {} })}
    </Box>
  );
}
