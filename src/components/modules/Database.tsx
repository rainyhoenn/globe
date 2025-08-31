import React, { useState, useRef } from 'react'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Upload, Trash2, Loader2, Edit3 } from 'lucide-react'; 
import { toast } from 'sonner';

import { useConrodsQuery, useAddConrodMutation, useDeleteConrodMutation, useUpdateConrodMutation } from '@/hooks/conrodHooks';
import { Conrod } from '@/types/types'; 

const Database: React.FC = () => {
  const { data: conrods = [], isLoading: isLoadingConrods, error: conrodsError } = useConrodsQuery();

  const addConrodMutation = useAddConrodMutation({
    onSuccess: (data) => {
      toast.success(`Conrod '${data.name}' added successfully!`);
      setIsAddDialogOpen(false);
      resetFormData();
    },
    onError: (error) => {
      toast.error(`Failed to add conrod: ${error.message}`);
    }
  });

  const deleteConrodMutation = useDeleteConrodMutation({
    onSuccess: (data) => {
      toast.success(`Conrod deleted successfully!`);
    },
    onError: (error) => {
      toast.error(`Failed to delete conrod: ${error.message}`);
    }
  });

  const updateConrodMutation = useUpdateConrodMutation({
    onSuccess: (data) => {
      toast.success(`Conrod '${data.name}' updated successfully!`);
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update conrod: ${error.message}`);
    }
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false); 
  const [editingConrod, setEditingConrod] = useState<Conrod | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', dimensions: { smallEndDiameter: '', bigEndDiameter: '', centerDistance: '' }, pin: '', ballBearing: '' });

  const [formData, setFormData] = useState({
    name: '',
    dimensions: { smallEndDiameter: '', bigEndDiameter: '', centerDistance: '' },
    pin: '',
    ballBearing: '',
  });

  const resetFormData = () => {
    setFormData({ name: '', dimensions: { smallEndDiameter: '', bigEndDiameter: '', centerDistance: '' }, pin: '', ballBearing: '' });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [name]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, dimensions, pin, ballBearing } = formData;
    if (!name || !dimensions.smallEndDiameter || !dimensions.bigEndDiameter || !dimensions.centerDistance || !pin || !ballBearing) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      addConrodMutation.mutate({
        name,
        dimensions: {
          smallEndDiameter: parseFloat(dimensions.smallEndDiameter),
          bigEndDiameter: parseFloat(dimensions.bigEndDiameter),
          centerDistance: parseFloat(dimensions.centerDistance),
        },
        pin,
        ballBearing,
      });
    } catch (error) {
        toast.error("Invalid dimension value. Please enter numbers.");
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this conrod definition? This cannot be undone.')) {
      deleteConrodMutation.mutate(id);
    }
  }

  const openEditDialog = (conrod: Conrod) => {
    setEditingConrod(conrod);
    setEditFormData({
      name: conrod.name,
      dimensions: {
        smallEndDiameter: conrod.dimensions.smallEndDiameter?.toString() || '',
        bigEndDiameter: conrod.dimensions.bigEndDiameter?.toString() || '',
        centerDistance: conrod.dimensions.centerDistance?.toString() || '',
      },
      pin: conrod.pin,
      ballBearing: conrod.ballBearing,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, dimensions: { ...prev.dimensions, [name]: value } }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConrod) return;
    const { name, dimensions, pin, ballBearing } = editFormData;
    if (!name || !dimensions.smallEndDiameter || !dimensions.bigEndDiameter || !dimensions.centerDistance || !pin || !ballBearing) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      updateConrodMutation.mutate({
        id: editingConrod.id,
        name,
        dimensions: {
          smallEndDiameter: parseFloat(dimensions.smallEndDiameter),
          bigEndDiameter: parseFloat(dimensions.bigEndDiameter),
          centerDistance: parseFloat(dimensions.centerDistance),
        },
        pin,
        ballBearing,
      });
    } catch {
      toast.error("Invalid dimension value. Please enter numbers.");
    }
  };

  const handleCsvImport = async () => {
      if (!csvFile) return;
      setIsImporting(true);
      let successCount = 0;
      let errorCount = 0;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const csvText = event.target?.result as string;
              const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== ''); 
              if (lines.length <= 1) {
                  throw new Error("CSV file is empty or contains only headers.");
              }
              const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '')); 

              const requiredColumns = ['name', 'smallenddiameter', 'bigenddiameter', 'centerdistance', 'pin', 'ballbearing'];
              const missingColumns = requiredColumns.filter(col => !headers.includes(col));
              if (missingColumns.length > 0) {
                  throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
              }

              const nameIdx = headers.indexOf('name');
              const smallEndIdx = headers.indexOf('smallenddiameter');
              const bigEndIdx = headers.indexOf('bigenddiameter');
              const centerDistIdx = headers.indexOf('centerdistance');
              const pinIdx = headers.indexOf('pin');
              const ballBearingIdx = headers.indexOf('ballbearing');

              // First, get the current highest serial number from the database
              let parsedRows = [];
              for (let i = 1; i < lines.length; i++) {
                  const values = lines[i].split(',').map(v => v.trim());
                  if (values.length !== headers.length) {
                      console.warn(`Skipping row ${i + 1}: Incorrect number of columns.`);
                      errorCount++;
                      continue;
                  }

                  try {
                      const small = parseFloat(values[smallEndIdx]);
                      const big = parseFloat(values[bigEndIdx]);
                      const center = parseFloat(values[centerDistIdx]);
                      const payload = {
                          name: values[nameIdx],
                          dimensions: {
                              smallEndDiameter: !isNaN(small) ? small : null,
                              bigEndDiameter: !isNaN(big) ? big : null,
                              centerDistance: !isNaN(center) ? center : null,
                          },
                          pin: values[pinIdx],
                          ballBearing: values[ballBearingIdx],
                      };
                      if (!payload.name || !payload.pin || !payload.ballBearing) {
                          throw new Error(`Invalid data in row ${i + 1}`);
                      }
                      parsedRows.push(payload);
                  } catch (parseError: any) {
                      console.error(`Error processing row ${i + 1}:`, parseError.message);
                      errorCount++;
                  }
              }
              
              // Process rows sequentially to maintain unique srNo
              const mutationPromises = [];
              let currentIndex = 0;
              
              const processNextRow = async () => {
                if (currentIndex >= parsedRows.length) return;
                
                try {
                  await addConrodMutation.mutateAsync(parsedRows[currentIndex]);
                  successCount++;
                } catch (error) {
                  console.error(`Failed to import row: ${error.message}`);
                  errorCount++;
                }
                
                currentIndex++;
                await processNextRow();
              };
              
              if (parsedRows.length > 0) {
                await processNextRow();
              }

              // Processing is now handled sequentially in processNextRow

              if (successCount > 0) {
                  toast.success(`Import finished: ${successCount} conrods added.`);
              } else if (errorCount > 0) {
                   toast.warning(`Import failed: ${errorCount} rows had errors.`);
              } else {
                  toast.info("Import complete, but no valid rows found to import.");
              }

              setIsImportDialogOpen(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
              setCsvFile(null);

          } catch (error: any) {
              toast.error(`Import failed: ${error.message}`);
              console.error(error);
          } finally {
              setIsImporting(false);
          }
      };

      reader.onerror = () => {
          toast.error('Error reading CSV file.');
          setIsImporting(false);
      }
      reader.readAsText(csvFile);
  };

  if (isLoadingConrods) {
    return <div className="flex justify-center items-center h-64 gap-2"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading Conrod Data...</div>;
  }

  if (conrodsError) {
    return <div className="text-destructive text-center p-4 border border-destructive rounded-md">Error loading conrods: {conrodsError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Conrod Database</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Conrod Database
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr No</TableHead>
                <TableHead>Conrod Name</TableHead>
                <TableHead>Dimensions (Small End / Big End / Center)</TableHead>
                <TableHead>Pin</TableHead>
                <TableHead>Ball Bearing</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conrods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No conrod definitions found.
                  </TableCell>
                </TableRow>
              ) : (
                conrods.map((conrod: Conrod) => (
                  <TableRow key={conrod.id}>
                    <TableCell className="font-medium">{conrod.srNo}</TableCell>
                    <TableCell>{conrod.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {`${conrod.dimensions.smallEndDiameter} / ${conrod.dimensions.bigEndDiameter} / ${conrod.dimensions.centerDistance}`}
                    </TableCell>
                    <TableCell>{conrod.pin}</TableCell>
                    <TableCell>{conrod.ballBearing}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => openEditDialog(conrod)} aria-label="Edit conrod">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(conrod.id)}
                          disabled={deleteConrodMutation.isPending && deleteConrodMutation.variables === conrod.id}
                          aria-label="Delete conrod"
                        >
                          {deleteConrodMutation.isPending && deleteConrodMutation.variables === conrod.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive-foreground" />
                          )}
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Conrod Definition</DialogTitle>
            <DialogDescription>
Enter the details for the new conrod type.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="name" className="text-right">Name</Label>
               <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="smallEndDiameter" className="text-right">Small End Dia.</Label>
               <Input id="smallEndDiameter" name="smallEndDiameter" type="number" step="0.01" value={formData.dimensions.smallEndDiameter} onChange={handleDimensionChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="bigEndDiameter" className="text-right">Big End Dia.</Label>
               <Input id="bigEndDiameter" name="bigEndDiameter" type="number" step="0.01" value={formData.dimensions.bigEndDiameter} onChange={handleDimensionChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="centerDistance" className="text-right">Center Dist.</Label>
               <Input id="centerDistance" name="centerDistance" type="number" step="0.01" value={formData.dimensions.centerDistance} onChange={handleDimensionChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="pin" className="text-right">Pin Name</Label>
               <Input id="pin" name="pin" value={formData.pin} onChange={handleInputChange} className="col-span-3" placeholder="e.g., P-101" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="ballBearing" className="text-right">Ball Bearing Name</Label>
               <Input id="ballBearing" name="ballBearing" value={formData.ballBearing} onChange={handleInputChange} className="col-span-3" placeholder="e.g., BB-205" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addConrodMutation.isPending}>
                {addConrodMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Conrod
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Conrod Definition</DialogTitle>
            <DialogDescription>Modify the details of the conrod.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="name" className="text-right">Name</Label>
               <Input id="name" name="name" value={editFormData.name} onChange={handleEditInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="smallEndDiameter" className="text-right">Small End Dia.</Label>
               <Input id="smallEndDiameter" name="smallEndDiameter" type="number" step="0.01" value={editFormData.dimensions.smallEndDiameter} onChange={handleEditDimensionChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="bigEndDiameter" className="text-right">Big End Dia.</Label>
               <Input id="bigEndDiameter" name="bigEndDiameter" type="number" step="0.01" value={editFormData.dimensions.bigEndDiameter} onChange={handleEditDimensionChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="centerDistance" className="text-right">Center Dist.</Label>
               <Input id="centerDistance" name="centerDistance" type="number" step="0.01" value={editFormData.dimensions.centerDistance} onChange={handleEditDimensionChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="pin" className="text-right">Pin Name</Label>
               <Input id="pin" name="pin" value={editFormData.pin} onChange={handleEditInputChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="ballBearing" className="text-right">Ball Bearing Name</Label>
               <Input id="ballBearing" name="ballBearing" value={editFormData.ballBearing} onChange={handleEditInputChange} className="col-span-3" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateConrodMutation.isPending}>
                {updateConrodMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) { 
            if (fileInputRef.current) fileInputRef.current.value = '';
            setCsvFile(null);
        }
        setIsImportDialogOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Conrods from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: name, smallEndDiameter, bigEndDiameter, centerDistance, pin, ballBearing.
              Headers must match exactly (case-insensitive, spaces ignored).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              disabled={isImporting}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleCsvImport} disabled={!csvFile || isImporting}>
              {isImporting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
              ) : (
                'Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Database;
