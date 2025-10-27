<<<<<<< HEAD

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CategoryAttribute } from '@/data/categoryAttributes';

interface DynamicAttributeSelectorProps {
  attributes: CategoryAttribute[];
  selectedAttributes: Record<string, any>;
  onAttributeChange: (attributeId: string, value: any) => void;
  className?: string;
}

const DynamicAttributeSelector = ({ 
  attributes, 
  selectedAttributes, 
  onAttributeChange,
  className = ""
}: DynamicAttributeSelectorProps) => {
  const renderAttributeInput = (attribute: CategoryAttribute) => {
    const value = selectedAttributes[attribute.id] || '';

    switch (attribute.type) {
      case 'select':
      case 'size':
        return (
          <Select 
            value={value} 
            onValueChange={(newValue) => {
              console.log(`Selecting ${attribute.name}:`, newValue);
              onAttributeChange(attribute.id, newValue);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${attribute.name}`} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'color':
        return (
          <div className="flex gap-2 flex-wrap">
            {attribute.options?.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  console.log(`Selecting color:`, color);
                  onAttributeChange(attribute.id, color);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  value === color ? 'border-primary border-4 ring-2 ring-primary/20' : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.toLowerCase() }}
                title={color}
              />
            ))}
          </div>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {attribute.options?.map((option) => {
              const currentValues = Array.isArray(value) ? value : [];
              const isChecked = currentValues.includes(option);
              
              return (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${attribute.id}-${option}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newValues = [...currentValues, option];
                        onAttributeChange(attribute.id, newValues);
                      } else {
                        const newValues = currentValues.filter((v: string) => v !== option);
                        onAttributeChange(attribute.id, newValues);
                      }
                    }}
                  />
                  <Label htmlFor={`${attribute.id}-${option}`}>{option}</Label>
                </div>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={attribute.id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onAttributeChange(attribute.id, checked)}
            />
            <Label htmlFor={attribute.id}>Yes</Label>
          </div>
        );

      default:
        return (
          <Select 
            value={value} 
            onValueChange={(newValue) => onAttributeChange(attribute.id, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${attribute.name}`} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {attributes.map((attribute) => (
        <div key={attribute.id}>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">
            {attribute.name}
            {attribute.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderAttributeInput(attribute)}
        </div>
      ))}
    </div>
  );
};

export default DynamicAttributeSelector;
=======

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CategoryAttribute } from '@/data/categoryAttributes';

interface DynamicAttributeSelectorProps {
  attributes: CategoryAttribute[];
  selectedAttributes: Record<string, any>;
  onAttributeChange: (attributeId: string, value: any) => void;
  className?: string;
}

const DynamicAttributeSelector = ({ 
  attributes, 
  selectedAttributes, 
  onAttributeChange,
  className = ""
}: DynamicAttributeSelectorProps) => {
  const renderAttributeInput = (attribute: CategoryAttribute) => {
    const value = selectedAttributes[attribute.id] || '';

    switch (attribute.type) {
      case 'select':
      case 'size':
        return (
          <Select 
            value={value} 
            onValueChange={(newValue) => {
              console.log(`Selecting ${attribute.name}:`, newValue);
              onAttributeChange(attribute.id, newValue);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${attribute.name}`} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'color':
        return (
          <div className="flex gap-2 flex-wrap">
            {attribute.options?.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  console.log(`Selecting color:`, color);
                  onAttributeChange(attribute.id, color);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  value === color ? 'border-primary border-4 ring-2 ring-primary/20' : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.toLowerCase() }}
                title={color}
              />
            ))}
          </div>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {attribute.options?.map((option) => {
              const currentValues = Array.isArray(value) ? value : [];
              const isChecked = currentValues.includes(option);
              
              return (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${attribute.id}-${option}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newValues = [...currentValues, option];
                        onAttributeChange(attribute.id, newValues);
                      } else {
                        const newValues = currentValues.filter((v: string) => v !== option);
                        onAttributeChange(attribute.id, newValues);
                      }
                    }}
                  />
                  <Label htmlFor={`${attribute.id}-${option}`}>{option}</Label>
                </div>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={attribute.id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onAttributeChange(attribute.id, checked)}
            />
            <Label htmlFor={attribute.id}>Yes</Label>
          </div>
        );

      default:
        return (
          <Select 
            value={value} 
            onValueChange={(newValue) => onAttributeChange(attribute.id, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${attribute.name}`} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {attributes.map((attribute) => (
        <div key={attribute.id}>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">
            {attribute.name}
            {attribute.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderAttributeInput(attribute)}
        </div>
      ))}
    </div>
  );
};

export default DynamicAttributeSelector;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
