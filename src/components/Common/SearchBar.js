import * as React from 'react';
import { styled } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 8,
  backgroundColor: '#121616',
  marginRight: theme.spacing(2),
  marginLeft: 8,
  width: '100%',
  height: 64,
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.up('sm')]: {
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export default function SearchBar({ filterText, setFilterText }) {
  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon style={{ color: '#676767' }} />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder="Search ticker or name…"
        inputProps={{ 'aria-label': 'search' }}
        value={filterText}
        onChange={setFilterText}
      />
    </Search>
  );
}
