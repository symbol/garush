import { Art } from 'garush-storage';
import React, { useContext, useEffect, useState } from 'react';
import { Stack } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { ConfigurationContext, Network } from './App';
import FileCard from './FileCard';
import Site from './Site';

export default function Dashboard() {
    const { network } = useParams<{ network: Network }>();
    const { searchService } = useContext(ConfigurationContext)[network];
    const [arts, setArts] = useState<Art[]>([]);
    const [fromHeight, setFromHeight] = useState<bigint | undefined>(undefined);
    useEffect(() => {
        const list = arts;
        searchService.search({ fromHeight: fromHeight }).subscribe(
            (a) => {
                list.push(a);
                setArts(list);
            },
            undefined,
            () => {
                const last = list.slice(-1)[0];
                if (last) {
                    setFromHeight(last.creationHeight);
                }
            },
        );
    }, [searchService, fromHeight]);

    return (
        <Site>
            <Stack gap={3} direction="horizontal" className="row-cols-md-2">
                {arts.map((art) => {
                    const hash = art.rootTransactionHash;
                    return <FileCard key={hash} file={{ ...art.metadata, rootTransaction: art.rootTransaction }} network={network} />;
                })}
            </Stack>
        </Site>
    );
}
