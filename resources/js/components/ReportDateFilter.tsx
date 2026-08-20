import { useState } from 'react';
import ReactSelect from 'react-select';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const datePresetOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Date Range (From - To)' },
];

const customReactSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: 'var(--background)',
        borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
        color: 'var(--foreground)',
        borderRadius: 'var(--radius)',
        fontSize: '0.875rem',
        minHeight: '2.375rem',
        boxShadow: state.isFocused ? '0 0 0 1px var(--ring)' : 'none',
        '&:hover': {
            borderColor: 'var(--ring)',
        },
    }),
    valueContainer: (base: any) => ({
        ...base,
        paddingTop: '0px',
        paddingBottom: '0px',
    }),
    singleValue: (base: any) => ({
        ...base,
        color: 'var(--foreground)',
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: 'var(--popover)',
        color: 'var(--popover-foreground)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
            ? 'var(--primary)'
            : state.isFocused
            ? 'var(--accent)'
            : 'transparent',
        color: state.isSelected
            ? 'var(--primary-foreground)'
            : state.isFocused
            ? 'var(--accent-foreground)'
            : 'var(--popover-foreground)',
        cursor: 'pointer',
    }),
};

interface Props {
    filters: {
        preset?: string;
        start_date?: string;
        end_date?: string;
        [key: string]: any;
    };
    onFilterChange: (newFilters: Record<string, string>) => void;
    extraFiltersNode?: React.ReactNode;
}

export default function ReportDateFilter({ filters, onFilterChange, extraFiltersNode }: Props) {
    const [preset, setPreset] = useState(filters.preset || (filters.start_date || filters.end_date ? 'custom' : 'all'));
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handlePresetSelect = (selectedPreset: string) => {
        setPreset(selectedPreset);
        if (selectedPreset !== 'custom') {
            setStartDate('');
            setEndDate('');
            onFilterChange({
                preset: selectedPreset,
                start_date: '',
                end_date: '',
            });
        }
    };

    const handleApplyCustomRange = () => {
        onFilterChange({
            preset: 'custom',
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleReset = () => {
        setPreset('all');
        setStartDate('');
        setEndDate('');
        onFilterChange({
            preset: 'all',
            start_date: '',
            end_date: '',
        });
    };

    const isFiltered = (preset && preset !== 'all') || Boolean(startDate) || Boolean(endDate);

    return (
        <Card className="border-sidebar-border/70 shadow-sm bg-sidebar/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    
                    {/* Extra module specific search/filters (if provided) */}
                    {extraFiltersNode && (
                        <div className="flex-1 min-w-0">
                            {extraFiltersNode}
                        </div>
                    )}

                    {/* Date Filters Group */}
                    <div className="flex flex-wrap items-end gap-3">
                        
                        {/* Period Quick Select */}
                        <div className="w-48 sm:w-56">
                            <Label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Calendar className="size-3.5" /> Period Preset
                            </Label>
                            <ReactSelect
                                options={datePresetOptions}
                                value={datePresetOptions.find((o) => o.value === preset) || datePresetOptions[0]}
                                onChange={(opt) => handlePresetSelect(opt ? opt.value : 'all')}
                                styles={customReactSelectStyles}
                            />
                        </div>

                        {/* Custom Date Inputs (Show when Custom selected or when dates populated) */}
                        {(preset === 'custom' || startDate || endDate) && (
                            <>
                                <div className="w-36 sm:w-40">
                                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Date (From)</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setPreset('custom');
                                        }}
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="w-36 sm:w-40">
                                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">End Date (To)</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setPreset('custom');
                                        }}
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <Button
                                    size="sm"
                                    onClick={handleApplyCustomRange}
                                    className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs font-semibold px-4"
                                >
                                    <Filter className="size-3.5" /> Apply Range
                                </Button>
                            </>
                        )}

                        {/* Reset Filters */}
                        {isFiltered && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 px-3"
                                title="Reset Date Filter"
                            >
                                <RotateCcw className="size-3.5" /> Reset
                            </Button>
                        )}
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
