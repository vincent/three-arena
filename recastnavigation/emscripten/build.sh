#!/bin/bash

EMCC_FAST_COMPILER=0

# PATH TO EMCC
export LLVM='/usr/local/opt/llvm/bin'
export CC='/Users/vincent/Workspace/emscripten/emcc'

export CFLAGS='--closure 1 -O2 -g -s WARN_ON_UNDEFINED_SYMBOLS=0 -s NO_EXIT_RUNTIME=1 -s LINKABLE=0 -s ALLOW_MEMORY_GROWTH=1 -s DISABLE_GL_EMULATION=1 -s DISABLE_EXCEPTION_CATCHING=0 --bind'
export DEFINES='-D NOT_GCC -D EMSCRIPTEN -D USES_UNIX_DIR'
export INCLUDES='-I ../src/Recast/Include 			
				 -I ../src/Detour/Include 			
				 -I ../src/DetourCrowd/Include 			
				 -I ../src/RecastDemo/Include 		
				 -I ../src/DebugUtils/Include 		
				 -I ../src/DetourTileCache/Include
				 -I ./js_interface'
export FILES='../src/DebugUtils/Source/DebugDraw.cpp
			  ../src/DebugUtils/Source/DetourDebugDraw.cpp
			  ../src/DebugUtils/Source/RecastDebugDraw.cpp
			  ../src/DebugUtils/Source/RecastDump.cpp
			  ../src/Detour/Source/DetourAlloc.cpp
			  ../src/Detour/Source/DetourCommon.cpp
			  ../src/Detour/Source/DetourNavMesh.cpp
			  ../src/Detour/Source/DetourNavMeshBuilder.cpp
			  ../src/Detour/Source/DetourNavMeshQuery.cpp
			  ../src/Detour/Source/DetourNode.cpp
			  ../src/DetourCrowd/Source/DetourCrowd.cpp
			  ../src/DetourCrowd/Source/DetourLocalBoundary.cpp
			  ../src/DetourCrowd/Source/DetourObstacleAvoidance.cpp
			  ../src/DetourCrowd/Source/DetourPathCorridor.cpp
			  ../src/DetourCrowd/Source/DetourPathQueue.cpp
			  ../src/DetourCrowd/Source/DetourProximityGrid.cpp
			  ../src/DetourTileCache/Source/DetourTileCache.cpp
			  ../src/DetourTileCache/Source/DetourTileCacheBuilder.cpp
			  ../src/Recast/Source/Recast.cpp
			  ../src/Recast/Source/RecastAlloc.cpp
			  ../src/Recast/Source/RecastArea.cpp
			  ../src/Recast/Source/RecastContour.cpp
			  ../src/Recast/Source/RecastFilter.cpp
			  ../src/Recast/Source/RecastLayers.cpp
			  ../src/Recast/Source/RecastMesh.cpp
			  ../src/Recast/Source/RecastMeshDetail.cpp
			  ../src/Recast/Source/RecastRasterization.cpp
			  ../src/Recast/Source/RecastRegion.cpp
			  ../src/RecastDemo/Source/ChunkyTriMesh.cpp
			  ../src/RecastDemo/Source/Filelist.cpp
			  ../src/RecastDemo/Source/InputGeom.cpp
			  ../src/RecastDemo/Source/MeshLoaderObj.cpp
			  ../src/RecastDemo/Source/PerfTimer.cpp
			  ../src/RecastDemo/Source/Sample.cpp
			  ../src/RecastDemo/Source/Sample_Debug.cpp
			  ../src/RecastDemo/Source/Sample_SoloMesh.cpp
			  ../src/RecastDemo/Source/Sample_TileMesh.cpp
			  ../src/RecastDemo/Source/ValueHistory.cpp

			  js_interface/JavascriptInterface.cpp
			  js_interface/main.new.cpp'

#			  ../src/RecastDemo/Source/SampleInterfaces.cpp
#			  ../src/RecastDemo/Source/Sample_TempObstacles.cpp

export FLAGS='-v'
export PRELOAD=''

export PREJS='--pre-js js_interface/module.js'
export LIBRARYJS='--js-library js_interface/library_recast.js'

mkdir -p build
 
$PRE_FLAGS $CC $FLAGS $DEFINES $INCLUDES $CFLAGS $FILES $LIBRARYJS -s EXPORTED_FUNCTIONS='[]' $PREJS -o $1 $PRELOAD
