import importlib.util,json,tempfile,unittest,argparse
from pathlib import Path
spec=importlib.util.spec_from_file_location('benchmark',Path(__file__).resolve().parents[1]/'tools/benchmark.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
class AccountingTests(unittest.TestCase):
    def test_actual_credits_and_both_attempts(self):
        c=b.baseline_costs();self.assertEqual(c['measured']['providerCredits'],6689);self.assertEqual(c['measured']['mixAttempts'],2);self.assertEqual(c['measured']['recordedLocalStageWallSeconds'],364.92);self.assertIsNone(c['unknown']['providerCashUsd'])
    def test_scenarios_do_not_invent_totals(self):
        c=b.baseline_costs();self.assertEqual(b.estimates(c,{})['results'],{})
        s=b.estimates(c,{'usdPerSynthesisCredit':.01,'averageLocalWatts':100})
        self.assertAlmostEqual(s['results']['synthesisScenarioUsd'],66.89)
        self.assertAlmostEqual(s['results']['recordedLocalEnergyScenarioKwh'],364.92*100/3600000)
        self.assertIsNone(c['unknown']['providerCashUsd'])
        with self.assertRaises(ValueError):b.estimates(c,{'usdPerSynthesisCredit':-1})
class PaidBoundaryTests(unittest.TestCase):
    def test_fresh_synthesis_requires_opt_in_before_network_or_marker(self):
        import shutil
        from unittest.mock import patch
        root=Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as tmp:
            work=Path(tmp)
            shutil.copyfile(root/'recipes/reference-v1/produce_audio.py',work/'produce_audio.py')
            for name in ['dialogue-plan-v1.json','script-v1.md','episode-script-v1.json']:
                shutil.copyfile(root/'benchmarks/000/reference'/name,work/name)
            spec=importlib.util.spec_from_file_location('fresh_producer',work/'produce_audio.py');producer=importlib.util.module_from_spec(spec);spec.loader.exec_module(producer)
            with patch.object(producer,'urlopen',side_effect=AssertionError('Network must not be reached')):
                with self.assertRaisesRegex(RuntimeError,'--allow-paid'):producer.generate()
            self.assertEqual(list((work/'audio-v1').glob('*.request.json')),[])

class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.old=b.ROOT;b.ROOT=Path(self.temp.name)
        for x in ['recipe','ref','benchmarks/000/baseline/evidence']:(b.ROOT/x).mkdir(parents=True)
        (b.ROOT/'ref/input.txt').write_text('frozen')
        (b.ROOT/'recipe/task.py').write_text("from pathlib import Path\nPath('output.txt').write_text(Path('input.txt').read_text())\n")
        self.config={'recipe':'recipe','reference':'ref','steps':[{'id':'test','dependsOn':[],'command':['{python}','task.py'],'inputs':['task.py','input.txt'],'outputs':['output.txt']}]}
        self.args=argparse.Namespace(run_id='test-001',target='test',allow_paid=False)
    def tearDown(self):b.ROOT=self.old;self.temp.cleanup()
    def test_cache_invalidates_on_output_and_input_changes(self):
        b.run_pipeline(self.args,self.config);b.run_pipeline(self.args,self.config)
        p=b.ROOT/'runs/test-001/events.jsonl';self.assertEqual(len(p.read_text().splitlines()),2)
        work=b.ROOT/'runs/test-001/work';(work/'output.txt').write_text('tampered')
        with self.assertRaises(AssertionError):b.verify_run('test-001')
        b.run_pipeline(self.args,self.config);self.assertEqual(len(p.read_text().splitlines()),4)
        (work/'input.txt').write_text('changed');b.run_pipeline(self.args,self.config)
        self.assertEqual((work/'output.txt').read_text(),'changed')
        self.assertEqual(b.verify_run('test-001')['incrementalTotals']['newSynthesisCredits'],0)
    def test_event_tampering_detected(self):
        b.run_pipeline(self.args,self.config);p=b.ROOT/'runs/test-001/events.jsonl';rows=p.read_text().splitlines();d=json.loads(rows[1]);d['wallSeconds']=0;rows[1]=json.dumps(d);p.write_text('\n'.join(rows)+'\n')
        with self.assertRaises(AssertionError):b.verify_run('test-001')
    def test_dependency_cycle_and_changed_config_rejected(self):
        b.run_pipeline(self.args,self.config)
        altered={**self.config,'extra':1}
        with self.assertRaises(ValueError):b.initialize('test-001',altered)
        with self.assertRaises(ValueError):b.ordered_steps({'steps':[{'id':'a','dependsOn':['b']},{'id':'b','dependsOn':['a']}]},'a')
    def test_frozen_recipe_snapshot(self):
        b.run_pipeline(self.args,self.config);(b.ROOT/'recipe/task.py').write_text('raise RuntimeError()')
        b.run_pipeline(self.args,self.config)
        self.assertEqual(len((b.ROOT/'runs/test-001/events.jsonl').read_text().splitlines()),2)
if __name__=='__main__':unittest.main()
