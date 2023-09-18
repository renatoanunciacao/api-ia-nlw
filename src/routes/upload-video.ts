import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { prisma } from "../lib/prisma";


const pump = promisify(pipeline)


export async function uploadVideoRoute(app: FastifyInstance) {

    app.register(fastifyMultipart, {
        limits: {
            fieldSize: 1_848_576 * 48,//25mb
        }
    })

    app.post('/videos', async (request, reply) => {
        const data = await request.file()

        if (!data) {
            return reply.status(400).send({ error: 'Missing file input.' });
        }

        const extension = path.extname(data.filename);
        if (extension !== '.mp3') {
            return reply.status(400).send({ error: 'Invalid input type, please upload a mp3.' });
        }

        const fileBaseName = path.basename(data.filename, extension);
        const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`;
        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName);
        // if (!fs.existsSync('../../tmp')) {
        //     const newDir = fs.mkdir(path.join(__dirname, '../../tmp'), (err) => {
        //         console.log('Directory created successfully!');
        //     });
        // }


        await pump(data.file, fs.createWriteStream(uploadDestination));

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadDestination
            }
        })

        console.log("video: ", video)

        return { video };
    });

}