import { Canvas, useFrame } from '@react-three/fiber';
import React, { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface GlobeProps {
    rotationSpeed: number;
    radius: number;
    wireframeColor?: string;
    wireframeOpacity?: number;
}

function Globe({
    rotationSpeed,
    radius,
    wireframeColor = '#94a3b8',
    wireframeOpacity = 0.14,
}: GlobeProps) {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame(() => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y += rotationSpeed;
        groupRef.current.rotation.x += rotationSpeed * 0.3;
        groupRef.current.rotation.z += rotationSpeed * 0.1;
    });

    return (
        <group ref={groupRef}>
            <mesh>
                <sphereGeometry args={[radius, 48, 48]} />
                <meshBasicMaterial
                    color={wireframeColor}
                    transparent
                    opacity={wireframeOpacity}
                    wireframe
                />
            </mesh>
        </group>
    );
}

export type DotGlobeLayout = 'screen' | 'section' | 'embedded';

export interface DotGlobeHeroProps extends React.HTMLAttributes<HTMLDivElement> {
    rotationSpeed?: number;
    globeRadius?: number;
    layout?: DotGlobeLayout;
    wireframeColor?: string;
    wireframeOpacity?: number;
    globeClassName?: string;
    contentClassName?: string;
    children?: React.ReactNode;
}

const DotGlobeHero = React.forwardRef<HTMLDivElement, DotGlobeHeroProps>(
    (
        {
            rotationSpeed = 0.005,
            globeRadius = 1,
            layout = 'screen',
            wireframeColor = '#94a3b8',
            wireframeOpacity = 0.14,
            className,
            globeClassName,
            contentClassName,
            children,
            ...props
        },
        ref,
    ) => {
        const isSection = layout === 'section';
        const isEmbedded = layout === 'embedded';

        return (
            <div
                ref={ref}
                className={cn(
                    'relative w-full overflow-hidden bg-background',
                    isEmbedded && 'h-full min-h-0',
                    isSection && 'h-auto min-h-[28rem]',
                    !isEmbedded && !isSection && 'h-screen',
                    className,
                )}
                {...props}
            >
                {children ? (
                    <div
                        className={cn(
                            'relative z-10',
                            isEmbedded && 'h-full w-full',
                            isSection && 'w-full',
                            !isEmbedded && !isSection && 'flex h-full flex-col items-center justify-center',
                            contentClassName,
                        )}
                    >
                        {children}
                    </div>
                ) : null}

                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 z-0',
                        isSection && !isEmbedded && 'opacity-40',
                        globeClassName,
                    )}
                    aria-hidden
                >
                    <Suspense fallback={null}>
                        <Canvas
                            dpr={[1, 1.5]}
                            camera={{
                                position: [0, 0, isEmbedded ? 2.6 : isSection ? 2.8 : 3],
                                fov: isEmbedded ? 62 : isSection ? 68 : 75,
                            }}
                            gl={{ alpha: true, antialias: true }}
                            style={{ background: 'transparent' }}
                        >
                            <ambientLight intensity={0.45} />
                            <pointLight position={[10, 10, 10]} intensity={0.8} />
                            <Globe
                                rotationSpeed={rotationSpeed}
                                radius={globeRadius}
                                wireframeColor={wireframeColor}
                                wireframeOpacity={wireframeOpacity}
                            />
                        </Canvas>
                    </Suspense>
                </div>
            </div>
        );
    },
);

DotGlobeHero.displayName = 'DotGlobeHero';

export { DotGlobeHero, Globe };
