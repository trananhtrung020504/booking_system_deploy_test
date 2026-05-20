import prisma from '../../config/database.js';
import { uploadToR2, deleteFromR2 } from '../../config/cloudflareR2.js';
import { ENV_VARS } from '../../config/env_vars.js';

const getR2KeyFromUrl = (url) => {
    if (!url) return null;
    const publicUrlPrefix = `${ENV_VARS.CLOUDFLARE_R2_PUBLIC_URL}/`;
    if (url.startsWith(publicUrlPrefix)) {
        return url.replace(publicUrlPrefix, '');
    }
    return null;
};

export const getCombos = async (req, res) => {
    try {
        const { all } = req.query;
        const whereClause = all === 'true' ? {} : { isActive: true };
        const combos = await prisma.combo.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        res.json(combos);
    } catch (error) {
        console.error(`[Controller Error] [web/comboController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const createCombo = async (req, res) => {
    try {
        const { name, description, price, isActive } = req.body;
        if (!name || !description || price === undefined) {
            return res.status(400).json({ message: "name, description, and price are required" });
        }

        let imageUrl = null;
        
        // Handle file upload to R2
        if (req.file) {
            const key = `combos/${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const result = await uploadToR2(key, req.file.buffer, req.file.mimetype);
            imageUrl = result.publicUrl;
        } else if (req.body.image) {
            imageUrl = req.body.image;
        }

        const combo = await prisma.combo.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                image: imageUrl,
                isActive: isActive !== 'false'
            }
        });

        res.status(201).json({ message: "Combo created successfully", combo });
    } catch (error) {
        console.error(`[Controller Error] [web/comboController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const updateCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, isActive, image } = req.body;

        const existingCombo = await prisma.combo.findUnique({
            where: { id }
        });

        if (!existingCombo) {
            return res.status(404).json({ message: "Combo not found" });
        }

        let imageUrl = existingCombo.image;

        // Handle image replacement
        if (req.file) {
            // Delete old R2 image if it exists
            const oldKey = getR2KeyFromUrl(existingCombo.image);
            if (oldKey) {
                try {
                    await deleteFromR2(oldKey);
                } catch (err) {
        console.error(`[Controller Error] [web/comboController.js]:`, err);
                    console.error("Failed to delete old R2 key:", oldKey, err);
                }
            }

            const key = `combos/${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const result = await uploadToR2(key, req.file.buffer, req.file.mimetype);
            imageUrl = result.publicUrl;
        } else if (image !== undefined) {
            if (!image && existingCombo.image) {
                const oldKey = getR2KeyFromUrl(existingCombo.image);
                if (oldKey) {
                    try {
                        await deleteFromR2(oldKey);
                    } catch (err) {
        console.error(`[Controller Error] [web/comboController.js]:`, err);
                        console.error("Failed to delete old R2 key:", oldKey, err);
                    }
                }
            }
            imageUrl = image || null;
        }

        const combo = await prisma.combo.update({
            where: { id },
            data: {
                name: name !== undefined ? name : existingCombo.name,
                description: description !== undefined ? description : existingCombo.description,
                price: price !== undefined ? parseFloat(price) : existingCombo.price,
                image: imageUrl,
                isActive: isActive !== undefined ? (isActive !== 'false' && isActive !== false) : existingCombo.isActive
            }
        });

        res.json({ message: "Combo updated successfully", combo });
    } catch (error) {
        console.error(`[Controller Error] [web/comboController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const existingCombo = await prisma.combo.findUnique({
            where: { id }
        });

        if (!existingCombo) {
            return res.status(404).json({ message: "Combo not found" });
        }

        // Delete old R2 image if it exists
        const oldKey = getR2KeyFromUrl(existingCombo.image);
        if (oldKey) {
            try {
                await deleteFromR2(oldKey);
            } catch (err) {
        console.error(`[Controller Error] [web/comboController.js]:`, err);
                console.error("Failed to delete old R2 key:", oldKey, err);
            }
        }

        await prisma.combo.delete({
            where: { id }
        });

        res.json({ message: "Combo deleted successfully" });
    } catch (error) {
        console.error(`[Controller Error] [web/comboController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
