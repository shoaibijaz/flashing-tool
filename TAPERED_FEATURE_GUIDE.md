# Tapered Diagram Feature Usage Guide

## Overview
The tapered diagram feature allows you to create a modified version of your original diagram where you can change segment lengths while preserving the angles between segments. This is useful for creating variations of your original design while maintaining the same shape characteristics.

## How to Use

### 1. Create an Original Drawing
- Start by drawing your original diagram on the canvas
- Click to place points and create segments
- Click "Finish" when your drawing is complete

### 2. Create a Tapered Diagram
- After finishing your original drawing, a "Create Tapered" button will appear in the navbar
- Click "Create Tapered" to generate a tapered version of your drawing
- The canvas will switch to "Tapered Mode" and show a blue border
- A "Tapered Mode" indicator will appear in the navbar

### 3. Edit Tapered Lengths
- A "Tapered Lengths" panel will appear on the right side of the screen
- Each segment shows:
  - Original length (gray text)
  - Current tapered length (blue, clickable)
  - Angle information (preserved from original)
- Click on any blue length value to edit it
- Enter a new length and press Enter or click the checkmark
- The diagram will update automatically while preserving all angles

### 4. Switch Between Views
- Use the "View Original" / "View Tapered" button to switch between original and tapered diagrams
- The canvas mode indicator shows which view is currently active

### 5. Clear Tapered Diagram
- Click "Clear Tapered" to remove the tapered diagram and return to original mode
- Click "Clear All" to clear both original and tapered diagrams

## Key Features

### Angle Preservation
- All angles between segments are preserved exactly as they were in the original
- Only segment lengths can be modified
- The shape topology remains unchanged

### Real-time Updates
- Changes to segment lengths are applied immediately
- The entire diagram recalculates to maintain angle consistency
- Visual feedback shows the current mode

### Intuitive Interface
- Simple click-to-edit length values
- Clear visual indicators for different modes
- Easy switching between original and tapered views

## Use Cases
- Creating scaled versions of patterns
- Adjusting dimensions while maintaining design integrity
- Exploring design variations
- Pattern development and iteration

## Technical Notes
- Angles are calculated as turn angles between consecutive segments
- The first segment's direction angle is preserved as a reference
- All subsequent segments maintain their relative angle relationships
- Length changes propagate through the entire diagram to maintain geometric consistency
